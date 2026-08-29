from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ============================================================
# USER / AUTH
# ============================================================

class UserCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    phone: str = Field(
        ...,
        min_length=10,
        max_length=15,
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )


class UserLogin(BaseModel):
    email: EmailStr

    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
    )


class UserResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    name: str
    email: EmailStr
    phone: str
    role: str = "customer"
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============================================================
# VENDOR AUTH
# ============================================================

class VendorRegister(BaseModel):
    owner_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    business_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    email: EmailStr

    phone: str = Field(
        ...,
        min_length=10,
        max_length=15,
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )

    business_description: str | None = Field(
        default=None,
        max_length=2000,
    )

    business_address: str | None = Field(
        default=None,
        max_length=1000,
    )


class VendorProfileResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    user_id: int
    business_name: str
    business_email: EmailStr
    business_phone: str
    business_description: str | None
    logo: str | None
    business_address: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class VendorAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    vendor_profile: VendorProfileResponse


# ============================================================
# PASSWORD RESET
# ============================================================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str


class VerifyResetCodeRequest(BaseModel):
    email: EmailStr

    otp: str = Field(
        ...,
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
    )


class VerifyResetCodeResponse(BaseModel):
    message: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr

    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )


class ResetPasswordResponse(BaseModel):
    message: str


# ============================================================
# PRODUCT
# ============================================================

class ProductCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    brand: str | None = Field(
        default=None,
        max_length=150,
    )

    description: str | None = Field(
        default=None,
        max_length=10000,
    )

    category: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    subcategory: str | None = Field(
        default=None,
        max_length=100,
    )

    price: float = Field(
        ...,
        ge=0,
    )

    original_price: float | None = Field(
        default=None,
        ge=0,
    )

    image: str = Field(
        ...,
        min_length=1,
        max_length=500,
    )

    images: list[str] = Field(
        default_factory=list,
    )

    stock: int = Field(
        default=0,
        ge=0,
    )

    sku: str | None = Field(
        default=None,
        max_length=100,
    )

    specifications: dict[str, Any] = Field(
        default_factory=dict,
    )


class ProductStockUpdate(BaseModel):
    quantity: int = Field(
        ...,
        ge=1,
        le=1_000_000,
    )


class ProductResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    vendor_id: int | None

    name: str

    brand: str | None

    description: str | None

    category: str

    subcategory: str | None

    price: float

    original_price: float | None

    image: str

    images: list[str] = Field(
        default_factory=list
    )

    stock: int

    sku: str | None

    specifications: dict[str, Any] = Field(
        default_factory=dict
    )

    rating: float

    review_count: int

    is_active: bool

    vendor_name: str | None = None

    created_at: datetime

    updated_at: datetime


class VendorProductResponse(ProductResponse):
    pass


# ============================================================
# CART
# ============================================================

class CartItemCreate(BaseModel):
    product_id: int

    quantity: int = Field(
        default=1,
        ge=1,
    )


class CartItemUpdate(BaseModel):
    quantity: int = Field(
        ...,
        ge=1,
    )


class CartProductResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    name: str
    price: float
    image: str
    stock: int


class CartItemResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    product_id: int
    quantity: int
    product: CartProductResponse


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    subtotal: float
    item_count: int


# ============================================================
# WISHLIST
# ============================================================

class WishlistItemCreate(BaseModel):
    product_id: int


class WishlistItemResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    product_id: int
    product: ProductResponse


# ============================================================
# REVIEW
# ============================================================

class ReviewCreate(BaseModel):
    product_id: int

    rating: int = Field(
        ...,
        ge=1,
        le=5,
    )

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    comment: str = Field(
        ...,
        min_length=1,
        max_length=2000,
    )


class ReviewResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    user_id: int
    product_id: int
    rating: int
    title: str
    comment: str
    verified: bool
    created_at: datetime


# ============================================================
# ADDRESS
# ============================================================

class AddressCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    phone: str = Field(
        ...,
        min_length=10,
        max_length=15,
    )

    address_line: str = Field(
        ...,
        min_length=3,
        max_length=255,
    )

    city: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    state: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    postal_code: str = Field(
        ...,
        min_length=4,
        max_length=20,
    )

    country: str = Field(
        default="India",
        max_length=100,
    )

    is_default: bool = False


class AddressResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    user_id: int
    name: str
    phone: str
    address_line: str
    city: str
    state: str
    postal_code: str
    country: str
    is_default: bool
    created_at: datetime


# ============================================================
# ORDER
# ============================================================

class OrderItemCreate(BaseModel):
    product_id: int

    quantity: int = Field(
        ...,
        ge=1,
    )


class OrderCreate(BaseModel):
    address_id: int

    items: list[OrderItemCreate] = Field(
        ...,
        min_length=1,
    )

    coupon_code: str | None = Field(
        default=None,
        max_length=50,
    )

    payment_method: str = Field(
        default="Cash on Delivery",
        min_length=1,
        max_length=50,
    )


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    product_id: int | None

    vendor_id: int | None

    product_name: str

    price: float

    quantity: int


class OrderResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    user_id: int

    address_id: int | None

    subtotal: float

    discount: float

    delivery_charge: float

    total: float

    coupon_code: str | None

    payment_method: str

    status: str

    created_at: datetime

    updated_at: datetime

    items: list[OrderItemResponse]

    email_sent: bool = False


# ============================================================
# VENDOR ORDERS
# ============================================================

class VendorOrderItemResponse(BaseModel):
    product_id: int | None

    product_name: str

    price: float

    quantity: int

    total: float


class VendorOrderResponse(BaseModel):
    order_id: int

    customer_name: str

    customer_email: EmailStr

    customer_phone: str

    delivery_name: str | None = None

    delivery_phone: str | None = None

    delivery_address: str | None = None

    delivery_city: str | None = None

    delivery_state: str | None = None

    delivery_postal_code: str | None = None

    delivery_country: str | None = None

    order_status: str

    payment_method: str

    created_at: datetime

    vendor_subtotal: float

    items: list[VendorOrderItemResponse]


# ============================================================
# VENDOR PROFILE UPDATE
# ============================================================

class VendorProfileUpdate(BaseModel):
    business_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    business_description: str | None = Field(
        default=None,
        max_length=2000,
    )

    business_phone: str = Field(
        ...,
        min_length=10,
        max_length=15,
    )

    business_address: str | None = Field(
        default=None,
        max_length=1000,
    )

    logo: str | None = Field(
        default=None,
        max_length=500,
    )