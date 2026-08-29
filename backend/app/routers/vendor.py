import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Address,
    Order,
    OrderItem,
    Product,
    User,
    VendorProfile,
)
from ..schemas import (
    ProductCreate,
    ProductStockUpdate,
    VendorOrderResponse,
    VendorProfileResponse,
    VendorProfileUpdate,
    VendorProductResponse,
)
from ..security import get_current_vendor


router = APIRouter(
    prefix="/vendor",
    tags=["Vendor"],
)


# ============================================================
# HELPERS
# ============================================================

def serialize_product(product: Product) -> dict[str, Any]:
    images: list[str] = []

    if product.images_json:
        try:
            parsed = json.loads(product.images_json)

            if isinstance(parsed, list):
                images = [
                    str(item).strip()
                    for item in parsed
                    if str(item).strip()
                ]
        except (TypeError, ValueError, json.JSONDecodeError):
            images = []

    specifications: dict[str, Any] = {}

    if product.specifications_json:
        try:
            parsed = json.loads(
                product.specifications_json
            )

            if isinstance(parsed, dict):
                specifications = parsed
        except (TypeError, ValueError, json.JSONDecodeError):
            specifications = {}

    vendor_name = None

    if product.vendor:
        vendor_profile = product.vendor.vendor_profile

        if vendor_profile and vendor_profile.business_name:
            vendor_name = (
                vendor_profile.business_name.strip()
            )
        elif product.vendor.name:
            vendor_name = product.vendor.name.strip()

    return {
        "id": product.id,
        "vendor_id": product.vendor_id,
        "name": product.name,
        "brand": product.brand,
        "description": product.description,
        "category": product.category,
        "subcategory": product.subcategory,
        "price": float(product.price or 0),
        "original_price": (
            float(product.original_price)
            if product.original_price is not None
            else None
        ),
        "image": product.image,
        "images": images,
        "stock": int(product.stock or 0),
        "sku": product.sku,
        "specifications": specifications,
        "rating": float(product.rating or 0),
        "review_count": int(product.review_count or 0),
        "is_active": bool(product.is_active),
        "vendor_name": vendor_name,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }


def build_delivery_address(
    address: Address | None,
) -> str | None:
    if not address:
        return None

    parts = [
        address.address_line,
        (
            f"{address.city}, "
            f"{address.state} "
            f"{address.postal_code}"
        ),
        address.country,
    ]

    return "\n".join(
        str(part).strip()
        for part in parts
        if part and str(part).strip()
    )


def clean_optional_string(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()

    return cleaned or None


# ============================================================
# VENDOR PROFILE
# ============================================================

@router.get(
    "/profile",
    response_model=VendorProfileResponse,
)
def get_vendor_profile(
    current_user: User = Depends(get_current_vendor),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(VendorProfile)
        .filter(
            VendorProfile.user_id == current_user.id
        )
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found.",
        )

    return profile


@router.put(
    "/profile",
    response_model=VendorProfileResponse,
)
def update_vendor_profile(
    profile_data: VendorProfileUpdate,
    current_user: User = Depends(get_current_vendor),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(VendorProfile)
        .filter(
            VendorProfile.user_id == current_user.id
        )
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found.",
        )

    business_name = profile_data.business_name.strip()
    business_phone = profile_data.business_phone.strip()

    if len(business_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Business name must contain at least 2 characters.",
        )

    if len(business_phone) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Business phone must contain at least 10 characters.",
        )

    profile.business_name = business_name

    profile.business_description = (
        clean_optional_string(
            profile_data.business_description
        )
    )

    profile.business_phone = business_phone

    profile.business_address = (
        clean_optional_string(
            profile_data.business_address
        )
    )

    profile.logo = clean_optional_string(
        profile_data.logo
    )

    db.commit()
    db.refresh(profile)

    return profile


# ============================================================
# VENDOR PRODUCTS
# ============================================================

@router.get(
    "/products",
    response_model=list[VendorProductResponse],
)
def get_vendor_products(
    current_user: User = Depends(get_current_vendor),
    db: Session = Depends(get_db),
):
    products = (
        db.query(Product)
        .filter(
            Product.vendor_id == current_user.id
        )
        .order_by(
            Product.created_at.desc()
        )
        .all()
    )

    return [
        serialize_product(product)
        for product in products
    ]


@router.post(
    "/products",
    response_model=VendorProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_vendor_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_vendor),
    db: Session = Depends(get_db),
):
    name = product_data.name.strip()
    category = product_data.category.strip()
    image = product_data.image.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product name is required.",
        )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product category is required.",
        )

    if not image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Primary product image URL is required.",
        )

    clean_sku = (
        product_data.sku.strip()
        if product_data.sku
        else None
    )

    if clean_sku:
        existing_sku = (
            db.query(Product)
            .filter(
                Product.sku == clean_sku,
                Product.vendor_id == current_user.id,
            )
            .first()
        )

        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A product with this SKU "
                    "already exists in your catalog."
                ),
            )

    product = Product(
        vendor_id=current_user.id,

        name=name,

        brand=(
            product_data.brand.strip()
            if product_data.brand
            else None
        ),

        description=(
            product_data.description.strip()
            if product_data.description
            else None
        ),

        category=category,

        subcategory=(
            product_data.subcategory.strip()
            if product_data.subcategory
            else None
        ),

        price=float(product_data.price),

        original_price=(
            float(product_data.original_price)
            if product_data.original_price is not None
            else None
        ),

        image=image,

        images_json=json.dumps(
            product_data.images,
            ensure_ascii=False,
        ),

        stock=int(product_data.stock),

        sku=clean_sku,

        specifications_json=json.dumps(
            product_data.specifications,
            ensure_ascii=False,
        ),

        rating=0,

        review_count=0,

        is_active=True,
    )

    try:
        db.add(product)
        db.commit()
        db.refresh(product)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create the product.",
        )

    return serialize_product(product)


@router.put(
    "/products/{product_id}",
    response_model=VendorProductResponse,
)
def update_vendor_product(
    product_id: int,
    product_data: ProductCreate,
    current_user: User = Depends(get_current_vendor),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.vendor_id == current_user.id,
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Product not found or you do not "
                "own this product."
            ),
        )

    name = product_data.name.strip()
    category = product_data.category.strip()
    image = product_data.image.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product name is required.",
        )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product category is required.",
        )

    if not image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Primary product image URL is required.",
        )

    clean_sku = (
        product_data.sku.strip()
        if product_data.sku
        else None
    )

    if clean_sku:
        duplicate_sku = (
            db.query(Product)
            .filter(
                Product.sku == clean_sku,
                Product.vendor_id == current_user.id,
                Product.id != product.id,
            )
            .first()
        )

        if duplicate_sku:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Another product in your catalog "
                    "already uses this SKU."
                ),
            )

    product.name = name

    product.brand = (
        product_data.brand.strip()
        if product_data.brand
        else None
    )

    product.description = (
        product_data.description.strip()
        if product_data.description
        else None
    )

    product.category = category

    product.subcategory = (
        product_data.subcategory.strip()
        if product_data.subcategory
        else None
    )

    product.price = float(product_data.price)

    product.original_price = (
        float(product_data.original_price)
        if product_data.original_price is not None
        else None
    )

    product.image = image

    product.stock = int(product_data.stock)

    product.sku = clean_sku

    product.images_json = json.dumps(
        product_data.images,
        ensure_ascii=False,
    )

    product.specifications_json = json.dumps(
        product_data.specifications,
        ensure_ascii=False,
    )

    try:
        db.commit()
        db.refresh(product)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update the product.",
        )

    return serialize_product(product)


@router.delete(
    "/products/{product_id}",
)
def delete_vendor_product(
    product_id: int,
    current_user: User = Depends(get_current_vendor),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.vendor_id == current_user.id,
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Product not found or you do not "
                "own this product."
            ),
        )

    if not product.is_active:
        return {
            "success": True,
            "message": "Product is already archived.",
            "product_id": product.id,
            "is_active": False,
        }

    product.is_active = False

    try:
        db.commit()
        db.refresh(product)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to archive the product.",
        )

    return {
        "success": True,
        "message": (
            "Product archived successfully "
            "and removed from the live marketplace."
        ),
        "product_id": product.id,
        "is_active": False,
    }


# ============================================================
# INCREASE STOCK
# ============================================================

@router.put(
    "/products/{product_id}/stock",
    response_model=VendorProductResponse,
)
def increase_vendor_product_stock(
    product_id: int,
    stock_data: ProductStockUpdate,
    current_user: User = Depends(get_current_vendor),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.vendor_id == current_user.id,
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Product not found or you do not "
                "own this product."
            ),
        )

    if not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This product is archived and cannot "
                "receive additional stock."
            ),
        )

    quantity = int(stock_data.quantity)

    if quantity < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock quantity must be at least 1.",
        )

    current_stock = int(product.stock or 0)

    new_stock = current_stock + quantity

    if new_stock > 2_147_483_647:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock value is too large.",
        )

    product.stock = new_stock

    try:
        db.commit()
        db.refresh(product)
    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update product stock.",
        )

    return serialize_product(product)


# ============================================================
# VENDOR DASHBOARD STATS
# ============================================================

@router.get(
    "/dashboard",
)
def vendor_dashboard(
    current_user: User = Depends(get_current_vendor),
    db: Session = Depends(get_db),
):
    products = (
        db.query(Product)
        .filter(
            Product.vendor_id == current_user.id
        )
        .all()
    )

    active_products = [
        product
        for product in products
        if product.is_active
    ]

    out_of_stock = [
        product
        for product in active_products
        if int(product.stock or 0) <= 0
    ]

    order_items = (
        db.query(OrderItem)
        .filter(
            OrderItem.vendor_id == current_user.id
        )
        .all()
    )

    total_revenue = sum(
        float(item.price or 0)
        * int(item.quantity or 0)
        for item in order_items
    )

    vendor_profile = current_user.vendor_profile

    business_name = (
        vendor_profile.business_name
        if vendor_profile and vendor_profile.business_name
        else current_user.name
    )

    return {
        "business_name": business_name,

        "total_products": len(products),

        "active_products": len(
            active_products
        ),

        "out_of_stock": len(
            out_of_stock
        ),

        "total_order_items": len(
            order_items
        ),

        "total_revenue": round(
            total_revenue,
            2,
        ),
    }


# ============================================================
# VENDOR ORDERS
# ============================================================

@router.get(
    "/orders",
    response_model=list[VendorOrderResponse],
)
def get_vendor_orders(
    current_user: User = Depends(get_current_vendor),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .join(
            OrderItem,
            OrderItem.order_id == Order.id,
        )
        .filter(
            OrderItem.vendor_id == current_user.id
        )
        .distinct()
        .order_by(
            Order.created_at.desc()
        )
        .all()
    )

    response: list[dict[str, Any]] = []

    for order in orders:
        vendor_items = [
            item
            for item in order.items
            if item.vendor_id == current_user.id
        ]

        if not vendor_items:
            continue

        customer_name = (
            order.user.name
            if order.user
            else "Customer"
        )

        customer_email = (
            str(order.user.email)
            if order.user
            else "unknown@example.com"
        )

        customer_phone = (
            str(order.user.phone)
            if order.user
            else ""
        )

        address = None

        if order.address_id:
            address = (
                db.query(Address)
                .filter(
                    Address.id == order.address_id
                )
                .first()
            )

        items: list[dict[str, Any]] = []

        vendor_subtotal = 0.0

        for item in vendor_items:
            line_total = (
                float(item.price or 0)
                * int(item.quantity or 0)
            )

            vendor_subtotal += line_total

            items.append(
                {
                    "product_id": item.product_id,
                    "product_name": item.product_name,
                    "price": float(item.price or 0),
                    "quantity": int(item.quantity or 0),
                    "total": round(
                        line_total,
                        2,
                    ),
                }
            )

        response.append(
            {
                "order_id": order.id,

                "customer_name": customer_name,

                "customer_email": customer_email,

                "customer_phone": customer_phone,

                "delivery_name": (
                    address.name
                    if address
                    else None
                ),

                "delivery_phone": (
                    address.phone
                    if address
                    else customer_phone
                ),

                "delivery_address": (
                    build_delivery_address(
                        address
                    )
                    if address
                    else None
                ),

                "delivery_city": (
                    address.city
                    if address
                    else None
                ),

                "delivery_state": (
                    address.state
                    if address
                    else None
                ),

                "delivery_postal_code": (
                    address.postal_code
                    if address
                    else None
                ),

                "delivery_country": (
                    address.country
                    if address
                    else None
                ),

                "order_status": order.status,

                "payment_method": order.payment_method,

                "created_at": order.created_at,

                "vendor_subtotal": round(
                    vendor_subtotal,
                    2,
                ),

                "items": items,
            }
        )

    return response


# ============================================================
# VENDOR ORDER STATUS
# ============================================================

@router.put(
    "/orders/{order_id}/status",
)
def update_vendor_order_status(
    order_id: int,
    new_status: str,
    current_user: User = Depends(get_current_vendor),
    db: Session = Depends(get_db),
):
    allowed_statuses = {
        "confirmed",
        "processing",
        "shipped",
        "delivered",
    }

    clean_status = (
        str(new_status)
        .strip()
        .lower()
    )

    if clean_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Vendor status must be one of: "
                "confirmed, processing, shipped, delivered."
            ),
        )

    order = (
        db.query(Order)
        .join(
            OrderItem,
            OrderItem.order_id == Order.id,
        )
        .filter(
            Order.id == order_id,
            OrderItem.vendor_id == current_user.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Order not found or this order "
                "does not contain your products."
            ),
        )

    order.status = clean_status

    try:
        db.commit()
        db.refresh(order)
    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update the order status.",
        )

    return {
        "success": True,
        "order_id": order.id,
        "status": order.status,
        "message": (
            f"Order status updated to "
            f"{order.status}."
        ),
    }