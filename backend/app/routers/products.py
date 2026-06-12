from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Product, Category, User, ActivityLog
from app.schemas import ProductCreate, ProductOut, CategoryCreate, CategoryOut
from app.services.auth import get_current_user

router = APIRouter()


@router.post("/categories", response_model=CategoryOut)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = Category(name=data.name, description=data.description)
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return CategoryOut.model_validate(cat)


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Category).where(Category.is_active == True).order_by(Category.id))
    return [CategoryOut.model_validate(c) for c in result.scalars().all()]


@router.post("/products", response_model=ProductOut)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Product).where(Product.sku == data.sku))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="SKU already exists")
    prod = Product(**data.model_dump())
    db.add(prod)
    await db.commit()
    await db.refresh(prod)
    log = ActivityLog(user_id=current_user.id, action="create_product", entity_type="product", entity_id=prod.id)
    db.add(log)
    await db.commit()
    return ProductOut.model_validate(prod)


@router.get("/products", response_model=list[ProductOut])
async def list_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Product).where(Product.is_active == True).order_by(Product.id))
    return [ProductOut.model_validate(p) for p in result.scalars().all()]


@router.get("/products/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    prod = result.scalar_one_or_none()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductOut.model_validate(prod)
