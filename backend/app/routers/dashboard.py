from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Product, Inventory, Order, Alert, ActivityLog, User
from app.schemas import DashboardData, ActivityLogOut, AlertOut
from app.services.auth import get_current_user

router = APIRouter()


@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_products_result = await db.execute(
        select(func.count(Product.id)).where(Product.is_active == True)
    )
    total_products = total_products_result.scalar() or 0

    value_result = await db.execute(
        select(func.coalesce(func.sum(Inventory.quantity * Product.price), 0))
        .join(Product, Inventory.product_id == Product.id)
    )
    total_inventory_value = float(value_result.scalar() or 0)

    pending_orders_result = await db.execute(
        select(func.count(Order.id)).where(Order.status.in_(["pending", "picking", "shipping"]))
    )
    total_orders_pending = pending_orders_result.scalar() or 0

    alerts_result = await db.execute(
        select(func.count(Alert.id)).where(Alert.is_read == False)
    )
    total_alerts = alerts_result.scalar() or 0

    low_stock_count = 0
    products = await db.execute(select(Product).where(Product.is_active == True))
    for p in products.scalars().all():
        inv_result = await db.execute(
            select(func.coalesce(func.sum(Inventory.quantity), 0)).where(Inventory.product_id == p.id)
        )
        qty = float(inv_result.scalar() or 0)
        if p.min_stock > 0 and qty <= p.min_stock:
            low_stock_count += 1

    activity_result = await db.execute(
        select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(10)
    )
    recent_activity = [ActivityLogOut.model_validate(a) for a in activity_result.scalars().all()]

    alerts_result = await db.execute(
        select(Alert).where(Alert.is_read == False).order_by(Alert.created_at.desc()).limit(10)
    )
    alerts = [AlertOut.model_validate(a) for a in alerts_result.scalars().all()]

    return DashboardData(
        total_products=total_products,
        total_inventory_value=total_inventory_value,
        total_orders_pending=total_orders_pending,
        total_alerts=total_alerts,
        low_stock_count=low_stock_count,
        recent_activity=recent_activity,
        alerts=alerts,
    )
