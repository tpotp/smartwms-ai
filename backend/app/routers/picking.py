from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database import get_db
from app.models import PickingTask, PickingItem, Order, OrderItem, Inventory, User, ActivityLog
from app.schemas import PickingTaskOut
from app.services.auth import get_current_user

router = APIRouter()


@router.post("/picking/assign/{order_id}")
async def assign_picking(
    order_id: int,
    user_id: int = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    task = PickingTask(
        order_id=order_id,
        assigned_to=user_id or current_user.id,
        status="assigned",
    )
    db.add(task)
    await db.flush()

    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order_id))
    items = items_result.scalars().all()

    for item in items:
        inv_result = await db.execute(
            select(Inventory).where(
                Inventory.product_id == item.product_id,
                Inventory.warehouse_id == order.warehouse_id,
                Inventory.quantity > 0,
            ).order_by(Inventory.expiration_date.asc().nulls_last())
        )
        inv_items = inv_result.scalars().all()
        to_pick = item.quantity_ordered
        for inv in inv_items:
            if to_pick <= 0:
                break
            pick_qty = min(to_pick, inv.quantity)
            pi = PickingItem(task_id=task.id, inventory_id=inv.id, quantity=pick_qty)
            db.add(pi)
            inv.quantity -= pick_qty
            to_pick -= pick_qty
            item.quantity_picked += pick_qty

    order.status = "picking"
    await db.commit()
    return {"message": "Picking assigned", "task_id": task.id}


@router.get("/picking/tasks", response_model=list[PickingTaskOut])
async def list_picking_tasks(
    status: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(PickingTask).order_by(PickingTask.created_at.desc())
    if status:
        q = q.where(PickingTask.status == status)
    result = await db.execute(q)
    tasks = result.scalars().all()
    out = []
    for t in tasks:
        o_result = await db.execute(select(Order).where(Order.id == t.order_id))
        order = o_result.scalar_one_or_none()
        t_out = PickingTaskOut.model_validate(t)
        if order:
            from app.schemas import OrderOut
            t_out.order = OrderOut.model_validate(order)
        out.append(t_out)
    return out


@router.post("/picking/{task_id}/complete")
async def complete_picking(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(PickingTask).where(PickingTask.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = "completed"
    task.completed_at = datetime.now(timezone.utc)

    o_result = await db.execute(select(Order).where(Order.id == task.order_id))
    order = o_result.scalar_one_or_none()
    if order:
        order.status = "picked"

    await db.commit()
    return {"message": "Picking completed"}
