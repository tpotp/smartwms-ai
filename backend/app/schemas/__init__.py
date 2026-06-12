from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "operator"
    warehouse_id: Optional[int] = None


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    warehouse_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginRequest(BaseModel):
    username: str
    password: str


class WarehouseCreate(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None


class WarehouseOut(BaseModel):
    id: int
    name: str
    code: str
    address: Optional[str]
    city: Optional[str]
    country: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class LocationCreate(BaseModel):
    warehouse_id: int
    code: str
    zone: Optional[str] = None
    aisle: Optional[str] = None
    rack: Optional[str] = None
    shelf: Optional[str] = None


class LocationOut(BaseModel):
    id: int
    warehouse_id: int
    code: str
    zone: Optional[str]
    aisle: Optional[str]
    rack: Optional[str]
    shelf: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    unit: str = "unidad"
    price: float = 0
    cost: float = 0
    min_stock: float = 0
    max_stock: float = 0


class ProductOut(BaseModel):
    id: int
    sku: str
    name: str
    description: Optional[str]
    category_id: Optional[int]
    unit: str
    price: float
    cost: float
    min_stock: float
    max_stock: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryOut(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    location_id: Optional[int]
    lot_number: Optional[str]
    serial_number: Optional[str]
    quantity: float
    expiration_date: Optional[date]
    product: Optional[ProductOut]
    location: Optional[LocationOut]

    class Config:
        from_attributes = True


class ReceiptCreate(BaseModel):
    warehouse_id: int
    supplier: Optional[str] = None
    notes: Optional[str] = None
    items: list["ReceiptItemCreate"]


class ReceiptItemCreate(BaseModel):
    product_id: int
    quantity_expected: float
    lot_number: Optional[str] = None
    serial_number: Optional[str] = None
    expiration_date: Optional[date] = None


class ReceiptOut(BaseModel):
    id: int
    reference_number: str
    warehouse_id: int
    supplier: Optional[str]
    status: str
    notes: Optional[str]
    created_by: Optional[int]
    created_at: datetime
    items: list["ReceiptItemOut"] = []

    class Config:
        from_attributes = True


class ReceiptItemOut(BaseModel):
    id: int
    receipt_id: int
    product_id: int
    quantity_expected: float
    quantity_received: float
    lot_number: Optional[str]
    serial_number: Optional[str]
    expiration_date: Optional[date]
    product: Optional[ProductOut]

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    order_type: str = "sale"
    warehouse_id: int
    customer: Optional[str] = None
    notes: Optional[str] = None
    items: list["OrderItemCreate"]


class OrderItemCreate(BaseModel):
    product_id: int
    quantity_ordered: float


class OrderOut(BaseModel):
    id: int
    order_number: str
    order_type: str
    status: str
    warehouse_id: int
    customer: Optional[str]
    notes: Optional[str]
    created_by: Optional[int]
    created_at: datetime
    items: list["OrderItemOut"] = []

    class Config:
        from_attributes = True


class OrderItemOut(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity_ordered: float
    quantity_picked: float
    quantity_shipped: float
    product: Optional[ProductOut]

    class Config:
        from_attributes = True


class PickingTaskOut(BaseModel):
    id: int
    order_id: int
    assigned_to: Optional[int]
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    order: Optional[OrderOut]

    class Config:
        from_attributes = True


class ShipmentOut(BaseModel):
    id: int
    order_id: int
    status: str
    tracking_number: Optional[str]
    created_at: datetime
    shipped_at: Optional[datetime]

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: int
    type: str
    title: Optional[str]
    message: Optional[str]
    related_entity: Optional[str]
    entity_id: Optional[int]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardData(BaseModel):
    total_products: int
    total_inventory_value: float
    total_orders_pending: int
    total_alerts: int
    low_stock_count: int
    recent_activity: list[ActivityLogOut]
    alerts: list[AlertOut]
