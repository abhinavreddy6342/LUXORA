import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Product
from ..schemas import ProductCreate, ProductResponse


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


# ============================================================
# SERIALIZE PRODUCT
# ============================================================

def serialize_product(
    product: Product,
) -> dict[str, Any]:
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


# ============================================================
# GET ALL ACTIVE MARKETPLACE PRODUCTS
# ============================================================

@router.get(
    "",
    response_model=list[ProductResponse],
)
def get_products(
    db: Session = Depends(get_db),
):
    """
    Return every active marketplace product.

    This is the primary source of truth for /shop.

    Includes:
    - original LUXORA catalog products
    - active vendor products

    Excludes:
    - archived products
    """

    products = (
        db.query(Product)
        .filter(
            Product.is_active.is_(True)
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


# ============================================================
# GET SINGLE ACTIVE PRODUCT
# ============================================================

@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.is_active.is_(True),
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    return serialize_product(product)


# ============================================================
# LEGACY CREATE PRODUCT
#
# Kept for compatibility with the existing application.
# Vendor creation should use /vendor/products.
# ============================================================

@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
    product = Product(
        name=product_data.name.strip(),

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

        category=product_data.category.strip(),

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

        image=product_data.image.strip(),

        stock=int(product_data.stock),

        sku=(
            product_data.sku.strip()
            if product_data.sku
            else None
        ),

        images_json=json.dumps(
            product_data.images,
            ensure_ascii=False,
        ),

        specifications_json=json.dumps(
            product_data.specifications,
            ensure_ascii=False,
        ),

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


# ============================================================
# LEGACY UPDATE PRODUCT
# ============================================================

@router.put(
    "/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: int,
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(
            Product.id == product_id
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    product.name = product_data.name.strip()

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

    product.category = (
        product_data.category.strip()
    )

    product.subcategory = (
        product_data.subcategory.strip()
        if product_data.subcategory
        else None
    )

    product.price = float(
        product_data.price
    )

    product.original_price = (
        float(product_data.original_price)
        if product_data.original_price is not None
        else None
    )

    product.image = (
        product_data.image.strip()
    )

    product.stock = int(
        product_data.stock
    )

    product.sku = (
        product_data.sku.strip()
        if product_data.sku
        else None
    )

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


# ============================================================
# LEGACY DELETE PRODUCT
# ============================================================

@router.delete(
    "/{product_id}",
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(
            Product.id == product_id
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

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
        "message": "Product archived successfully.",
        "product_id": product.id,
        "is_active": False,
    }