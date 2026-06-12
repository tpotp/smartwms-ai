from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Location, Warehouse, User
from app.schemas import LocationCreate, LocationOut
from app.services.auth import get_current_user

router = APIRouter()


@router.post("/locations", response_model=LocationOut)
async def create_location(
    data: LocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("admin", "supervisor"):
        raise HTTPException(status_code=403, detail="Not authorized")
    loc = Location(**data.model_dump())
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return LocationOut.model_validate(loc)


@router.get("/locations", response_model=list[LocationOut])
async def list_locations(
    warehouse_id: int = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Location).where(Location.is_active == True)
    if warehouse_id:
        q = q.where(Location.warehouse_id == warehouse_id)
    result = await db.execute(q.order_by(Location.id))
    return [LocationOut.model_validate(l) for l in result.scalars().all()]
