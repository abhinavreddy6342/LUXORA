from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Product, Review, User
from ..schemas import ReviewCreate, ReviewResponse


router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"],
)


# ============================================================
# GET REVIEWS FOR A PRODUCT
# ============================================================

@router.get(
    "/product/{product_id}",
    response_model=list[ReviewResponse],
)
def get_product_reviews(
    product_id: int,
    db: Session = Depends(get_db),
):
    """
    Return all reviews for a product.
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

    reviews = (
        db.query(Review)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    return reviews


# ============================================================
# CREATE REVIEW
# ============================================================

@router.post(
    "",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a review for a product.
    """

    product = (
        db.query(Product)
        .filter(
            Product.id == review_data.product_id,
            Product.is_active.is_(True),
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    # Prevent the same user from reviewing the same product twice.
    existing_review = (
        db.query(Review)
        .filter(
            Review.user_id == current_user.id,
            Review.product_id == review_data.product_id,
        )
        .first()
    )

    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this product.",
        )

    review = Review(
        user_id=current_user.id,
        product_id=review_data.product_id,
        rating=review_data.rating,
        title=review_data.title.strip(),
        comment=review_data.comment.strip(),
        verified=False,
    )

    db.add(review)

    # Update product rating statistics.
    existing_count = product.review_count

    new_count = existing_count + 1

    product.rating = (
        (product.rating * existing_count)
        + review_data.rating
    ) / new_count

    product.review_count = new_count

    db.commit()
    db.refresh(review)

    return review


# ============================================================
# GET CURRENT USER'S REVIEWS
# ============================================================

@router.get(
    "/my",
    response_model=list[ReviewResponse],
)
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return reviews created by the current user.
    """

    reviews = (
        db.query(Review)
        .filter(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )

    return reviews


# ============================================================
# DELETE REVIEW
# ============================================================

@router.delete(
    "/{review_id}",
)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete the current user's review.
    """

    review = (
        db.query(Review)
        .filter(
            Review.id == review_id,
            Review.user_id == current_user.id,
        )
        .first()
    )

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found.",
        )

    product = (
        db.query(Product)
        .filter(Product.id == review.product_id)
        .first()
    )

    if product:
        old_count = product.review_count

        if old_count > 1:
            product.review_count = old_count - 1

            product.rating = (
                (product.rating * old_count) - review.rating
            ) / product.review_count
        else:
            product.review_count = 0
            product.rating = 0

    db.delete(review)
    db.commit()

    return {
        "success": True,
        "message": "Review deleted successfully.",
    }