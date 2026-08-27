from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import CartItem, Product, User
from ..schemas import (
    CartItemCreate,
    CartItemResponse,
    CartItemUpdate,
    CartProductResponse,
    CartResponse,
)


router = APIRouter(
    prefix="/cart",
    tags=["Cart"],
)


# ============================================================
# GET CART
# ============================================================

@router.get(
    "",
    response_model=CartResponse,
)
def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return the current user's shopping cart.
    """

    cart_items = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .all()
    )

    subtotal = sum(
        item.product.price * item.quantity
        for item in cart_items
    )

    item_count = sum(
        item.quantity
        for item in cart_items
    )

    return {
        "items": cart_items,
        "subtotal": subtotal,
        "item_count": item_count,
    }


# ============================================================
# ADD ITEM TO CART
# ============================================================

@router.post(
    "",
    response_model=CartItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_to_cart(
    cart_data: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add a product to the current user's cart.
    """

    product = (
        db.query(Product)
        .filter(
            Product.id == cart_data.product_id,
            Product.is_active.is_(True),
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    if cart_data.quantity > product.stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested quantity exceeds available stock.",
        )

    existing_item = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
            CartItem.product_id == cart_data.product_id,
        )
        .first()
    )

    if existing_item:
        new_quantity = existing_item.quantity + cart_data.quantity

        if new_quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Requested quantity exceeds available stock.",
            )

        existing_item.quantity = new_quantity

        db.commit()
        db.refresh(existing_item)

        return existing_item

    cart_item = CartItem(
        user_id=current_user.id,
        product_id=cart_data.product_id,
        quantity=cart_data.quantity,
    )

    db.add(cart_item)
    db.commit()
    db.refresh(cart_item)

    return cart_item


# ============================================================
# UPDATE CART ITEM
# ============================================================

@router.put(
    "/{item_id}",
    response_model=CartItemResponse,
)
def update_cart_item(
    item_id: int,
    cart_data: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update the quantity of an item in the current user's cart.
    """

    cart_item = (
        db.query(CartItem)
        .filter(
            CartItem.id == item_id,
            CartItem.user_id == current_user.id,
        )
        .first()
    )

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found.",
        )

    product = (
        db.query(Product)
        .filter(Product.id == cart_item.product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    if not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product is no longer available.",
        )

    if cart_data.quantity > product.stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested quantity exceeds available stock.",
        )

    cart_item.quantity = cart_data.quantity

    db.commit()
    db.refresh(cart_item)

    return cart_item


# ============================================================
# REMOVE ITEM FROM CART
# ============================================================

@router.delete(
    "/{item_id}",
)
def remove_from_cart(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove one item from the current user's cart.
    """

    cart_item = (
        db.query(CartItem)
        .filter(
            CartItem.id == item_id,
            CartItem.user_id == current_user.id,
        )
        .first()
    )

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found.",
        )

    db.delete(cart_item)
    db.commit()

    return {
        "success": True,
        "message": "Item removed from cart successfully.",
    }


# ============================================================
# CLEAR CART
# ============================================================

@router.delete(
    "",
)
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove all items from the current user's cart.
    """

    deleted_count = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .delete(
            synchronize_session=False,
        )
    )

    db.commit()

    return {
        "success": True,
        "message": "Cart cleared successfully.",
        "deleted_items": deleted_count,
    }