from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Inventory, Product, Location, User
from app.schemas import InventoryOut, ProductOut, LocationOut
from app.services.auth import get_current_user

router = APIRouter()


@router.get("/inventory", response_model=list[InventoryOut])
async def list_inventory(
    warehouse_id: int = None,
    product_id: int = None,
    low_stock: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Inventory)
    if warehouse_id:
        q = q.where(Inventory.warehouse_id == warehouse_id)
    if product_id:
        q = q.where(Inventory.product_id == product_id)
    result = await db.execute(q.order_by(Inventory.id))
    items = result.scalars().all()
    out = []
    for inv in items:
        p_result = await db.execute(select(Product).where(Product.id == inv.product_id))
        product = p_result.scalar_one_or_none()
        loc_result = await db.execute(select(Location).where(Location.id == inv.location_id))
        location = loc_result.scalar_one_or_none()
        out.append(InventoryOut(
            id=inv.id, product_id=inv.product_id, warehouse_id=inv.warehouse_id,
            location_id=inv.location_id, lot_number=inv.lot_number,
            serial_number=inv.serial_number, quantity=inv.quantity,
            expiration_date=inv.expiration_date,
            product=ProductOut.model_validate(product) if product else None,
            location=LocationOut.model_validate(location) if location else None,
        ))
    if low_stock:
        out = [i for i in out if i.product and i.quantity <= i.product.min_stock]
    return out


@router.get("/inventory/summary")
async def inventory_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(
            Product.id, Product.sku, Product.name,
            Product.min_stock, Product.max_stock,
            func.coalesce(func.sum(Inventory.quantity), 0).label("total_qty"),
        )
        .outerjoin(Inventory, Inventory.product_id == Product.id)
        .where(Product.is_active == True)
        .group_by(Product.id).order_by(Product.id)
    )
    return [{
        "product_id": r.id, "sku": r.sku, "name": r.name,
        "total_quantity": float(r.total_qty),
        "min_stock": float(r.min_stock), "max_stock": float(r.max_stock),
        "status": "low" if float(r.total_qty) <= float(r.min_stock) else "over" if float(r.total_qty) >= float(r.max_stock) else "ok",
    } for r in result.all()]
