from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Product, User, WishlistItem
from ..schemas import WishlistItemCreate, WishlistItemResponse


router = APIRouter(
    prefix="/wishlist",
    tags=["Wishlist"],
)


# ============================================================
# GET WISHLIST
# ============================================================

@router.get(
    "",
    response_model=list[WishlistItemResponse],
)
def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return all products in the current user's wishlist.
    """

    wishlist_items = (
        db.query(WishlistItem)
        .filter(WishlistItem.user_id == current_user.id)
        .join(Product)
        .filter(Product.is_active.is_(True))
        .order_by(WishlistItem.created_at.desc())
        .all()
    )

    return wishlist_items


# ============================================================
# ADD TO WISHLIST
# ============================================================

@router.post(
    "",
    response_model=WishlistItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_to_wishlist(
    wishlist_data: WishlistItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add a product to the current user's wishlist.
    """

    # Check product
    product = (
        db.query(Product)
        .filter(
            Product.id == wishlist_data.product_id,
            Product.is_active.is_(True),
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    # Check if product is already in wishlist
    existing_item = (
        db.query(WishlistItem)
        .filter(
            WishlistItem.user_id == current_user.id,
            WishlistItem.product_id == wishlist_data.product_id,
        )
        .first()
    )

    if existing_item:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product is already in your wishlist.",
        )

    # Create wishlist item
    wishlist_item = WishlistItem(
        user_id=current_user.id,
        product_id=wishlist_data.product_id,
    )

    db.add(wishlist_item)
    db.commit()
    db.refresh(wishlist_item)

    return wishlist_item


# ============================================================
# REMOVE FROM WISHLIST
# ============================================================

@router.delete(
    "/{item_id}",
)
def remove_from_wishlist(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove a product from the current user's wishlist.
    """

    wishlist_item = (
        db.query(WishlistItem)
        .filter(
            WishlistItem.id == item_id,
            WishlistItem.user_id == current_user.id,
        )
        .first()
    )

    if not wishlist_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found.",
        )

    db.delete(wishlist_item)
    db.commit()

    return {
        "success": True,
        "message": "Item removed from wishlist successfully.",
    }


# ============================================================
# CLEAR WISHLIST
# ============================================================

@router.delete(
    "",
)
def clear_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove all items from the current user's wishlist.
    """

    deleted_items = (
        db.query(WishlistItem)
        .filter(WishlistItem.user_id == current_user.id)
        .delete(synchronize_session=False)
    )

    db.commit()

    return {
        "success": True,
        "message": "Wishlist cleared successfully.",
        "deleted_items": deleted_items,
    }