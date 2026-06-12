from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database import get_db
from app.models import Order, OrderItem, Product, User, ActivityLog
from app.schemas import OrderCreate, OrderOut, OrderItemOut
from app.services.auth import get_current_user

router = APIRouter()


def generate_order_number():
    now = datetime.now(timezone.utc)
    return f"ORD-{now.strftime('%Y%m%d-%H%M%S')}-{now.microsecond % 1000}"


@router.post("/orders", response_model=OrderOut)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = Order(
        order_number=generate_order_number(),
        order_type=data.order_type,
        status="pending",
        warehouse_id=data.warehouse_id,
        customer=data.customer,
        notes=data.notes,
        created_by=current_user.id,
    )
    db.add(order)
    await db.flush()

    for item_data in data.items:
        item = OrderItem(
            order_id=order.id,
            product_id=item_data.product_id,
            quantity_ordered=item_data.quantity_ordered,
        )
        db.add(item)

    await db.commit()
    await db.refresh(order)
    log = ActivityLog(user_id=current_user.id, action="create_order", entity_type="order", entity_id=order.id)
    db.add(log)
    await db.commit()

    return await _get_full_order(order.id, db)


@router.get("/orders", response_model=list[OrderOut])
async def list_orders(
    status: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Order).order_by(Order.created_at.desc())
    if status:
        q = q.where(Order.status == status)
    result = await db.execute(q)
    orders = result.scalars().all()
    out = []
    for o in orders:
        out.append(await _get_full_order(o.id, db))
    return out


@router.get("/orders/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _get_full_order(order_id, db)


async def _get_full_order(order_id: int, db: AsyncSession) -> OrderOut:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order_id))
    items = items_result.scalars().all()

    order_out = OrderOut.model_validate(order)
    order_out.items = []
    for item in items:
        p_result = await db.execute(select(Product).where(Product.id == item.product_id))
        product = p_result.scalar_one_or_none()
        item_out = OrderItemOut.model_validate(item)
        if product:
            item_out.product = product
        order_out.items.append(item_out)
    return order_out
