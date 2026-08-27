from datetime import datetime

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
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    phone: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


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

    description: str | None = None

    category: str = Field(
        ...,
        min_length=1,
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
        max_length=500,
    )

    stock: int = Field(
        default=0,
        ge=0,
    )


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    category: str
    price: float
    original_price: float | None
    image: str
    stock: int
    rating: float
    review_count: int
    is_active: bool
    created_at: datetime


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
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    price: float
    image: str
    stock: int


class CartItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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
    model_config = ConfigDict(from_attributes=True)

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
    model_config = ConfigDict(from_attributes=True)

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
    model_config = ConfigDict(from_attributes=True)

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
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int | None
    product_name: str
    price: float
    quantity: int


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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