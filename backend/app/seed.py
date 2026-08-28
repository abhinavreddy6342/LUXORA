from sqlalchemy.orm import Session
from .models import Product


INITIAL_PRODUCTS = [
    {
        "id": 1,
        "name": "Aero Chronograph",
        "category": "Timepieces",
        "price": 18999.0,
        "original_price": 21999.0,
        "description": "A refined chronograph designed with precision, clarity and timeless proportions.",
        "image": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=90",
        "stock": 100,
        "rating": 4.8,
        "review_count": 124,
        "is_active": True,
    },
    {
        "id": 2,
        "name": "Essential Leather",
        "category": "Accessories",
        "price": 8499.0,
        "original_price": 9999.0,
        "description": "Premium leather craftsmanship with a clean silhouette built for everyday use.",
        "image": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=90",
        "stock": 100,
        "rating": 4.9,
        "review_count": 86,
        "is_active": True,
    },
    {
        "id": 3,
        "name": "Studio Runner",
        "category": "Footwear",
        "price": 12999.0,
        "original_price": None,
        "description": "Lightweight everyday footwear combining comfort, performance and minimal design.",
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=90",
        "stock": 100,
        "rating": 4.7,
        "review_count": 213,
        "is_active": True,
    },
    {
        "id": 4,
        "name": "Minimal Carry",
        "category": "Travel",
        "price": 10999.0,
        "original_price": 12999.0,
        "description": "A structured travel companion designed for modern movement and effortless organization.",
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=90",
        "stock": 100,
        "rating": 4.8,
        "review_count": 97,
        "is_active": True,
    },
    {
        "id": 5,
        "name": "Mono Classic",
        "category": "Timepieces",
        "price": 15999.0,
        "original_price": None,
        "description": "A minimal timepiece with a balanced dial and understated character.",
        "image": "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&q=90",
        "stock": 100,
        "rating": 4.6,
        "review_count": 71,
        "is_active": True,
    },
    {
        "id": 6,
        "name": "Executive Tote",
        "category": "Accessories",
        "price": 11999.0,
        "original_price": 13999.0,
        "description": "A spacious premium tote crafted for workdays, travel and everything between.",
        "image": "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=90",
        "stock": 100,
        "rating": 4.9,
        "review_count": 142,
        "is_active": True,
    },
    {
        "id": 7,
        "name": "Urban Runner",
        "category": "Footwear",
        "price": 9499.0,
        "original_price": None,
        "description": "A versatile everyday sneaker with a clean urban profile.",
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=90",
        "stock": 100,
        "rating": 4.7,
        "review_count": 188,
        "is_active": True,
    },
    {
        "id": 8,
        "name": "Weekender",
        "category": "Travel",
        "price": 13999.0,
        "original_price": None,
        "description": "A spacious weekender designed for short trips and effortless travel.",
        "image": "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1200&q=90",
        "stock": 100,
        "rating": 4.8,
        "review_count": 104,
        "is_active": True,
    },
]


def seed_initial_products(db: Session) -> None:
    """
    Seed initial LUXORA products (IDs 1-8) into the database if missing.
    Ensures existing products have stock and active status.
    """
    for p_data in INITIAL_PRODUCTS:
        existing = db.query(Product).filter(Product.id == p_data["id"]).first()
        if not existing:
            existing_by_name = db.query(Product).filter(Product.name == p_data["name"]).first()
            if existing_by_name:
                existing_by_name.is_active = True
                if existing_by_name.stock < 1:
                    existing_by_name.stock = 100
            else:
                db.add(Product(**p_data))
        else:
            existing.is_active = True
            if existing.stock < 1:
                existing.stock = 100

    try:
        db.commit()
    except Exception as error:
        db.rollback()
        print(f"Product seeding warning: {error}")
