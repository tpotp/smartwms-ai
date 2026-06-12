from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Alert, User
from app.schemas import AlertOut
from app.services.auth import get_current_user

router = APIRouter()


@router.get("/alerts", response_model=list[AlertOut])
async def list_alerts(
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Alert).order_by(Alert.created_at.desc()).limit(50)
    if unread_only:
        q = q.where(Alert.is_read == False)
    result = await db.execute(q)
    return [AlertOut.model_validate(a) for a in result.scalars().all()]


@router.post("/alerts/{alert_id}/read")
async def mark_read(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert:
        alert.is_read = True
        await db.commit()
    return {"message": "Alert marked as read"}


@router.post("/alerts/generate")
async def generate_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models import Product, Inventory

    products = await db.execute(select(Product).where(Product.is_active == True))
    products = products.scalars().all()

    count = 0
    for p in products:
        inv_result = await db.execute(
            select(func.coalesce(func.sum(Inventory.quantity), 0)).where(Inventory.product_id == p.id)
        )
        total_qty = float(inv_result.scalar() or 0)

        if p.min_stock > 0 and total_qty <= p.min_stock:
            existing = await db.execute(
                select(Alert).where(Alert.type == "low_stock", Alert.entity_id == p.id, Alert.is_read == False)
            )
            if not existing.scalar_one_or_none():
                alert = Alert(
                    type="low_stock",
                    title="Stock bajo",
                    message=f"El producto {p.name} ({p.sku}) tiene stock bajo: {total_qty} (mínimo: {p.min_stock})",
                    related_entity="product",
                    entity_id=p.id,
                )
                db.add(alert)
                count += 1

        if p.max_stock > 0 and total_qty >= p.max_stock:
            existing = await db.execute(
                select(Alert).where(Alert.type == "over_stock", Alert.entity_id == p.id, Alert.is_read == False)
            )
            if not existing.scalar_one_or_none():
                alert = Alert(
                    type="over_stock",
                    title="Sobre stock",
                    message=f"El producto {p.name} ({p.sku}) tiene sobre stock: {total_qty} (máximo: {p.max_stock})",
                    related_entity="product",
                    entity_id=p.id,
                )
                db.add(alert)
                count += 1

    await db.commit()
    return {"message": f"{count} alerts generated"}
