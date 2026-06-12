from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database import get_db
from app.models import Receipt, ReceiptItem, Product, Inventory, User, ActivityLog
from app.schemas import ReceiptCreate, ReceiptOut, ReceiptItemOut, ProductOut
from app.services.auth import get_current_user

router = APIRouter()


def generate_ref():
    now = datetime.now(timezone.utc)
    return f"RCP-{now.strftime('%Y%m%d-%H%M%S')}-{now.microsecond % 1000}"


async def _get_product(product_id: int, db: AsyncSession):
    r = await db.execute(select(Product).where(Product.id == product_id))
    return r.scalar_one_or_none()


async def _get_full_receipt(receipt_id: int, db: AsyncSession) -> ReceiptOut:
    r = await db.execute(select(Receipt).where(Receipt.id == receipt_id))
    receipt = r.scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    ir = await db.execute(select(ReceiptItem).where(ReceiptItem.receipt_id == receipt_id))
    items = ir.scalars().all()
    out_items = []
    for item in items:
        product = await _get_product(item.product_id, db)
        po = ProductOut.model_validate(product) if product else None
        out_items.append(ReceiptItemOut(
            id=item.id, receipt_id=item.receipt_id, product_id=item.product_id,
            quantity_expected=item.quantity_expected, quantity_received=item.quantity_received,
            lot_number=item.lot_number, serial_number=item.serial_number,
            expiration_date=item.expiration_date, product=po,
        ))
    return ReceiptOut(
        id=receipt.id, reference_number=receipt.reference_number,
        warehouse_id=receipt.warehouse_id, supplier=receipt.supplier,
        status=receipt.status, notes=receipt.notes,
        created_by=receipt.created_by, created_at=receipt.created_at,
        items=out_items,
    )


@router.post("/receipts", response_model=ReceiptOut)
async def create_receipt(
    data: ReceiptCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    receipt = Receipt(
        reference_number=generate_ref(),
        warehouse_id=data.warehouse_id,
        supplier=data.supplier,
        notes=data.notes,
        status="pending",
        created_by=current_user.id,
    )
    db.add(receipt)
    await db.flush()
    for item_data in data.items:
        db.add(ReceiptItem(
            receipt_id=receipt.id, product_id=item_data.product_id,
            quantity_expected=item_data.quantity_expected, quantity_received=0,
            lot_number=item_data.lot_number, serial_number=item_data.serial_number,
            expiration_date=item_data.expiration_date,
        ))
    await db.commit()
    log = ActivityLog(user_id=current_user.id, action="create_receipt", entity_type="receipt", entity_id=receipt.id, details=f"Receipt {receipt.reference_number}")
    db.add(log)
    await db.commit()
    return await _get_full_receipt(receipt.id, db)


@router.get("/receipts", response_model=list[ReceiptOut])
async def list_receipts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Receipt).order_by(Receipt.created_at.desc()))
    out = []
    for r in result.scalars().all():
        out.append(await _get_full_receipt(r.id, db))
    return out


@router.post("/receipts/{receipt_id}/receive")
async def receive_receipt(
    receipt_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Receipt).where(Receipt.id == receipt_id))
    receipt = result.scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    items_result = await db.execute(select(ReceiptItem).where(ReceiptItem.receipt_id == receipt_id))
    items = items_result.scalars().all()
    for item in items:
        item.quantity_received = item.quantity_expected
        inv_result = await db.execute(
            select(Inventory).where(
                Inventory.product_id == item.product_id,
                Inventory.warehouse_id == receipt.warehouse_id,
                Inventory.lot_number == item.lot_number,
            )
        )
        inv = inv_result.scalar_one_or_none()
        if inv:
            inv.quantity += item.quantity_received
        else:
            db.add(Inventory(
                product_id=item.product_id, warehouse_id=receipt.warehouse_id,
                quantity=item.quantity_received, lot_number=item.lot_number,
                serial_number=item.serial_number, expiration_date=item.expiration_date,
            ))
    receipt.status = "completed"
    await db.commit()
    log = ActivityLog(user_id=current_user.id, action="receive_receipt", entity_type="receipt", entity_id=receipt.id, details=f"Receipt {receipt.reference_number} completed")
    db.add(log)
    await db.commit()
    return {"message": "Receipt completed", "reference": receipt.reference_number}
