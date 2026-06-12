from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database import get_db
from app.models import Receipt, ReceiptItem, Product, Inventory, Location, User, ActivityLog
from app.schemas import ReceiptCreate, ReceiptOut, ReceiptItemOut
from app.services.auth import get_current_user

router = APIRouter()


def generate_ref():
    now = datetime.now(timezone.utc)
    return f"RCP-{now.strftime('%Y%m%d-%H%M%S')}-{now.microsecond % 1000}"


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
        item = ReceiptItem(
            receipt_id=receipt.id,
            product_id=item_data.product_id,
            quantity_expected=item_data.quantity_expected,
            quantity_received=0,
            lot_number=item_data.lot_number,
            serial_number=item_data.serial_number,
            expiration_date=item_data.expiration_date,
        )
        db.add(item)

    await db.commit()
    await db.refresh(receipt)
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
    receipts = result.scalars().all()
    out = []
    for r in receipts:
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
            inv = Inventory(
                product_id=item.product_id,
                warehouse_id=receipt.warehouse_id,
                quantity=item.quantity_received,
                lot_number=item.lot_number,
                serial_number=item.serial_number,
                expiration_date=item.expiration_date,
            )
            db.add(inv)

    receipt.status = "completed"
    await db.commit()
    log = ActivityLog(user_id=current_user.id, action="receive_receipt", entity_type="receipt", entity_id=receipt.id, details=f"Receipt {receipt.reference_number} completed")
    db.add(log)
    await db.commit()

    return {"message": "Receipt completed", "reference": receipt.reference_number}


async def _get_full_receipt(receipt_id: int, db: AsyncSession) -> ReceiptOut:
    result = await db.execute(select(Receipt).where(Receipt.id == receipt_id))
    receipt = result.scalar_one_or_none()
    items_result = await db.execute(
        select(ReceiptItem).where(ReceiptItem.receipt_id == receipt_id)
    )
    items = items_result.scalars().all()

    receipt_out = ReceiptOut.model_validate(receipt)
    receipt_out.items = []
    for item in items:
        p_result = await db.execute(select(Product).where(Product.id == item.product_id))
        product = p_result.scalar_one_or_none()
        item_out = ReceiptItemOut.model_validate(item)
        if product:
            item_out.product = product
        receipt_out.items.append(item_out)
    return receipt_out
