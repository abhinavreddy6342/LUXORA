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
# GET ALL PRODUCTS
# ============================================================

@router.get(
    "",
    response_model=list[ProductResponse],
)
def get_products(
    db: Session = Depends(get_db),
):
    """
    Return all active LUXORA products.
    """

    products = (
        db.query(Product)
        .filter(Product.is_active.is_(True))
        .order_by(Product.created_at.desc())
        .all()
    )

    return products


# ============================================================
# GET SINGLE PRODUCT
# ============================================================

@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    """
    Return a single active product by ID.
    """

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

    return product


# ============================================================
# CREATE PRODUCT
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
    """
    Create a new LUXORA product.
    """

    product = Product(
        name=product_data.name.strip(),
        description=(
            product_data.description.strip()
            if product_data.description
            else None
        ),
        category=product_data.category.strip(),
        price=product_data.price,
        original_price=product_data.original_price,
        image=product_data.image.strip(),
        stock=product_data.stock,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


# ============================================================
# UPDATE PRODUCT
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
    """
    Update an existing LUXORA product.
    """

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    product.name = product_data.name.strip()

    product.description = (
        product_data.description.strip()
        if product_data.description
        else None
    )

    product.category = product_data.category.strip()
    product.price = product_data.price
    product.original_price = product_data.original_price
    product.image = product_data.image.strip()
    product.stock = product_data.stock

    db.commit()
    db.refresh(product)

    return product


# ============================================================
# DELETE PRODUCT
# ============================================================

@router.delete(
    "/{product_id}",
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    """
    Soft-delete a product by marking it inactive.
    """

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    product.is_active = False

    db.commit()

    return {
        "success": True,
        "message": "Product deleted successfully.",
    }