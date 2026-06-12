from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database import get_db
from app.models import Shipment, Order, User, ActivityLog
from app.schemas import ShipmentOut
from app.services.auth import get_current_user

router = APIRouter()


@router.post("/shipments/create/{order_id}", response_model=ShipmentOut)
async def create_shipment(
    order_id: int,
    tracking_number: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    existing = await db.execute(select(Shipment).where(Shipment.order_id == order_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Shipment already exists for this order")

    shipment = Shipment(
        order_id=order_id,
        status="pending",
        tracking_number=tracking_number,
        created_by=current_user.id,
    )
    db.add(shipment)
    await db.flush()

    order.status = "shipping"
    await db.commit()
    await db.refresh(shipment)
    log = ActivityLog(user_id=current_user.id, action="create_shipment", entity_type="shipment", entity_id=shipment.id)
    db.add(log)
    await db.commit()

    return ShipmentOut.model_validate(shipment)


@router.post("/shipments/{shipment_id}/dispatch")
async def dispatch_shipment(
    shipment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Shipment).where(Shipment.id == shipment_id))
    shipment = result.scalar_one_or_none()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    shipment.status = "dispatched"
    shipment.shipped_at = datetime.now(timezone.utc)

    o_result = await db.execute(select(Order).where(Order.id == shipment.order_id))
    order = o_result.scalar_one_or_none()
    if order:
        order.status = "shipped"

    await db.commit()
    return {"message": "Shipment dispatched"}


@router.get("/shipments", response_model=list[ShipmentOut])
async def list_shipments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Shipment).order_by(Shipment.created_at.desc()))
    return [ShipmentOut.model_validate(s) for s in result.scalars().all()]
