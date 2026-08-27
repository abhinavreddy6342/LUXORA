from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


# ============================================================
# USER
# ============================================================

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    addresses: Mapped[list["Address"]] = relationship(
        "Address",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    cart_items: Mapped[list["CartItem"]] = relationship(
        "CartItem",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    wishlist_items: Mapped[list["WishlistItem"]] = relationship(
        "WishlistItem",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    reviews: Mapped[list["Review"]] = relationship(
        "Review",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    orders: Mapped[list["Order"]] = relationship(
        "Order",
        back_populates="user",
        cascade="all, delete-orphan",
    )


# ============================================================
# ADDRESS
# ============================================================

class Address(Base):
    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    address_line: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    state: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    postal_code: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    country: Mapped[str] = mapped_column(
        String(100),
        default="India",
        nullable=False,
    )

    is_default: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="addresses",
    )


# ============================================================
# PRODUCT
# ============================================================

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    original_price: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    image: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    stock: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    rating: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )

    review_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    cart_items: Mapped[list["CartItem"]] = relationship(
        "CartItem",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    wishlist_items: Mapped[list["WishlistItem"]] = relationship(
        "WishlistItem",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    reviews: Mapped[list["Review"]] = relationship(
        "Review",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    order_items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="product",
    )


# ============================================================
# CART ITEM
# ============================================================

class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="cart_items",
    )

    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="cart_items",
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "product_id",
            name="unique_user_product_cart",
        ),
    )


# ============================================================
# WISHLIST ITEM
# ============================================================

class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="wishlist_items",
    )

    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="wishlist_items",
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "product_id",
            name="unique_user_product_wishlist",
        ),
    )


# ============================================================
# REVIEW
# ============================================================

class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    rating: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    comment: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="reviews",
    )

    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="reviews",
    )


# ============================================================
# ORDER
# ============================================================

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    address_id: Mapped[int | None] = mapped_column(
        ForeignKey("addresses.id", ondelete="SET NULL"),
        nullable=True,
    )

    subtotal: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    discount: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )

    delivery_charge: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )

    total: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    coupon_code: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    payment_method: Mapped[str] = mapped_column(
        String(50),
        default="Cash on Delivery",
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="orders",
    )

    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )


# ============================================================
# ORDER ITEM
# ============================================================

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    product_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="items",
    )

    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="order_items",
    )