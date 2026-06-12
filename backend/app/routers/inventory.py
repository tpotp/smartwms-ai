from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Inventory, Product, Location, Warehouse, User, ActivityLog
from app.schemas import InventoryOut
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

        inv_out = InventoryOut.model_validate(inv)
        if product:
            inv_out.product = product
        if location:
            inv_out.location = location
        out.append(inv_out)

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
            Product.id,
            Product.sku,
            Product.name,
            Product.min_stock,
            Product.max_stock,
            func.coalesce(func.sum(Inventory.quantity), 0).label("total_qty"),
        )
        .outerjoin(Inventory, Inventory.product_id == Product.id)
        .where(Product.is_active == True)
        .group_by(Product.id)
        .order_by(Product.id)
    )
    rows = result.all()
    data = []
    for r in rows:
        data.append({
            "product_id": r.id,
            "sku": r.sku,
            "name": r.name,
            "total_quantity": float(r.total_qty),
            "min_stock": float(r.min_stock),
            "max_stock": float(r.max_stock),
            "status": "low" if float(r.total_qty) <= float(r.min_stock) else "over" if float(r.total_qty) >= float(r.max_stock) else "ok",
        })
    return data
