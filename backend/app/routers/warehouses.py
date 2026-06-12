from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Warehouse, User, ActivityLog
from app.schemas import WarehouseCreate, WarehouseOut
from app.services.auth import get_current_user

router = APIRouter()


@router.post("/warehouses", response_model=WarehouseOut)
async def create_warehouse(
    data: WarehouseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("admin",):
        raise HTTPException(status_code=403, detail="Not authorized")
    wh = Warehouse(name=data.name, code=data.code, address=data.address, city=data.city, country=data.country)
    db.add(wh)
    await db.commit()
    await db.refresh(wh)
    log = ActivityLog(user_id=current_user.id, action="create_warehouse", entity_type="warehouse", entity_id=wh.id)
    db.add(log)
    await db.commit()
    return WarehouseOut.model_validate(wh)


@router.get("/warehouses", response_model=list[WarehouseOut])
async def list_warehouses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Warehouse).where(Warehouse.is_active == True).order_by(Warehouse.id))
    return [WarehouseOut.model_validate(w) for w in result.scalars().all()]
