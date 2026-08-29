from __future__ import annotations

import re
from typing import Any

from sqlalchemy.orm import Session

from ..models import CartItem, Product


# ============================================================
# CATEGORY ALIASES
# ============================================================

CATEGORY_ALIASES: dict[str, set[str]] = {
    "Timepieces": {
        "watch",
        "watches",
        "timepiece",
        "timepieces",
    },
    "Accessories": {
        "accessory",
        "accessories",
        "bag",
        "bags",
        "leather",
        "tote",
        "wallet",
    },
    "Footwear": {
        "shoe",
        "shoes",
        "sneaker",
        "sneakers",
        "runner",
        "runners",
        "footwear",
    },
    "Travel": {
        "travel",
        "weekender",
        "carry",
        "luggage",
        "travel bag",
    },
}


# ============================================================
# PRODUCT SERIALIZATION
# ============================================================

def serialize_product(product: Product) -> dict[str, Any]:
    """
    Convert a SQLAlchemy Product object into a safe dictionary.

    All catalog facts returned to the AI originate from the
    database.
    """

    vendor_name = None

    if product.vendor:
        if product.vendor.vendor_profile:
            vendor_name = (
                product.vendor.vendor_profile.business_name
            )
        else:
            vendor_name = product.vendor.name

    return {
        "id": int(product.id),
        "name": product.name,
        "brand": product.brand or "",
        "category": product.category,
        "subcategory": product.subcategory or "",
        "price": float(product.price),
        "original_price": (
            float(product.original_price)
            if product.original_price is not None
            else None
        ),
        "description": product.description or "",
        "image": product.image,
        "stock": int(product.stock),
        "rating": float(product.rating or 0),
        "review_count": int(product.review_count or 0),
        "is_active": bool(product.is_active),
        "vendor_id": product.vendor_id,
        "vendor_name": vendor_name,
    }


# ============================================================
# CATEGORY NORMALIZATION
# ============================================================

def normalize_category(category: str | None) -> str | None:
    """
    Normalize a category or category alias to one of the main
    LUXORA category names.

    Important:
    The database category itself is NOT modified.
    """

    if not category:
        return None

    clean = category.strip().lower()

    canonical_categories = {
        "timepieces",
        "accessories",
        "footwear",
        "travel",
    }

    if clean in canonical_categories:
        return clean.title()

    for canonical, aliases in CATEGORY_ALIASES.items():
        if clean in aliases:
            return canonical

    return None


# ============================================================
# CATEGORY MATCHING
# ============================================================

def product_matches_category(
    product_category: str,
    requested_category: str | None,
) -> bool:
    """
    Determine whether a database product belongs to the
    requested logical commerce category.

    Example:

        Watches -> Timepieces
        watch   -> Timepieces
    """

    if not requested_category:
        return True

    requested = normalize_category(requested_category)

    if not requested:
        return (
            product_category.strip().lower()
            == requested_category.strip().lower()
        )

    actual = normalize_category(product_category)

    if actual:
        return actual == requested

    return (
        product_category.strip().lower()
        == requested_category.strip().lower()
    )


# ============================================================
# ALL PRODUCTS
# ============================================================

def get_all_products(
    db: Session,
) -> list[dict[str, Any]]:
    """
    Return all active LUXORA products.
    """

    products = (
        db.query(Product)
        .filter(Product.is_active.is_(True))
        .order_by(Product.id.asc())
        .all()
    )

    return [
        serialize_product(product)
        for product in products
    ]


# ============================================================
# SINGLE PRODUCT
# ============================================================

def get_product(
    db: Session,
    product_id: int,
) -> dict[str, Any] | None:
    """
    Return one active product by database ID.
    """

    product = (
        db.query(Product)
        .filter(
            Product.id == int(product_id),
            Product.is_active.is_(True),
        )
        .first()
    )

    if not product:
        return None

    return serialize_product(product)


# ============================================================
# PRODUCT ID EXTRACTION
# ============================================================

def extract_product_ids_from_text(
    text: str,
) -> list[int]:
    """
    Extract explicit product IDs from natural-language text.

    Supported examples:

        product 1
        product #1
        item 5
        item #5
        products 1 and 5
    """

    if not text:
        return []

    matches = re.findall(
        r"(?:product|products|item|items)\s*#?\s*(\d+)",
        text.lower(),
    )

    result: list[int] = []
    seen: set[int] = set()

    for match in matches:
        try:
            product_id = int(match)
        except (TypeError, ValueError):
            continue

        if product_id <= 0:
            continue

        if product_id in seen:
            continue

        seen.add(product_id)
        result.append(product_id)

    return result


# ============================================================
# SEARCH PRODUCTS
# ============================================================

def search_products(
    db: Session,
    query: str = "",
    category: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
) -> list[dict[str, Any]]:
    """
    Search the real LUXORA catalog.

    Search is intentionally deterministic and does not call an LLM.
    """

    products = get_all_products(db)

    clean_query = str(query or "").strip().lower()

    query_terms = [
        term
        for term in re.findall(
            r"[a-zA-Z0-9]+",
            clean_query,
        )
        if len(term) > 2
    ]

    results: list[dict[str, Any]] = []

    for product in products:

        # ----------------------------------------------------
        # CATEGORY
        # ----------------------------------------------------

        if category:
            if not product_matches_category(
                product_category=product["category"],
                requested_category=category,
            ):
                continue

        # ----------------------------------------------------
        # PRICE
        # ----------------------------------------------------

        price = float(product["price"])

        if (
            min_price is not None
            and price < float(min_price)
        ):
            continue

        if (
            max_price is not None
            and price > float(max_price)
        ):
            continue

        # ----------------------------------------------------
        # SEARCH TEXT
        # ----------------------------------------------------

        searchable_text = " ".join(
            [
                str(product.get("name") or ""),
                str(product.get("brand") or ""),
                str(product.get("category") or ""),
                str(product.get("subcategory") or ""),
                str(product.get("description") or ""),
                str(product.get("vendor_name") or ""),
            ]
        ).lower()

        # ----------------------------------------------------
        # QUERY MATCH
        # ----------------------------------------------------

        if query_terms:

            matched_terms = sum(
                1
                for term in query_terms
                if term in searchable_text
            )

            if matched_terms == 0:
                continue

        results.append(product)

    return results


# ============================================================
# MATCH SCORE
# ============================================================

def calculate_match_score(
    product: dict[str, Any],
    query: str = "",
    category: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
) -> int:
    """
    Calculate a deterministic AI match score from real
    product/request signals.

    Score is NOT randomly generated.

    Factors include:
        - category match
        - query relevance
        - budget fit
        - rating
        - stock availability
    """

    score = 0

    name = str(
        product.get("name") or ""
    ).lower()

    brand = str(
        product.get("brand") or ""
    ).lower()

    product_category = str(
        product.get("category") or ""
    ).lower()

    subcategory = str(
        product.get("subcategory") or ""
    ).lower()

    description = str(
        product.get("description") or ""
    ).lower()

    vendor_name = str(
        product.get("vendor_name") or ""
    ).lower()

    searchable_text = (
        f"{name} "
        f"{brand} "
        f"{product_category} "
        f"{subcategory} "
        f"{description} "
        f"{vendor_name}"
    )

    # --------------------------------------------------------
    # CATEGORY
    # --------------------------------------------------------

    if category:
        if product_matches_category(
            product_category=product.get("category", ""),
            requested_category=category,
        ):
            score += 30

    # --------------------------------------------------------
    # QUERY TERMS
    # --------------------------------------------------------

    query_terms = [
        term
        for term in re.findall(
            r"[a-zA-Z0-9]+",
            str(query or "").lower(),
        )
        if len(term) > 2
    ]

    for term in query_terms:

        if term in name:
            score += 18

        elif term in brand:
            score += 15

        elif term in product_category or term in subcategory:
            score += 12

        elif term in vendor_name:
            score += 10

        elif term in description:
            score += 8

    # --------------------------------------------------------
    # PRICE
    # --------------------------------------------------------

    price = float(
        product.get("price") or 0
    )

    if max_price is not None:

        max_value = float(max_price)

        if max_value > 0:

            if price <= max_value:
                score += 30

                ratio = price / max_value

                # Strong fit when reasonably close to budget
                if ratio >= 0.70:
                    score += 5

            else:
                # Explicitly penalize products above budget.
                score -= 20

    if min_price is not None:
        min_value = float(min_price)

        if price >= min_value:
            score += 5
        else:
            score -= 5

    # --------------------------------------------------------
    # RATING
    # --------------------------------------------------------

    rating = float(
        product.get("rating") or 0
    )

    score += min(
        10,
        max(
            0,
            round(rating * 2),
        ),
    )

    # --------------------------------------------------------
    # STOCK
    # --------------------------------------------------------

    stock = int(
        product.get("stock") or 0
    )

    if stock > 0:
        score += 5
    else:
        score -= 25

    # --------------------------------------------------------
    # FINAL
    # --------------------------------------------------------

    return max(
        0,
        min(
            99,
            int(score),
        ),
    )


# ============================================================
# RANK PRODUCTS
# ============================================================

def rank_products(
    products: list[dict[str, Any]],
    query: str = "",
    category: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
) -> list[dict[str, Any]]:
    """
    Enrich products with deterministic match scores and
    rank strongest matches first.
    """

    ranked: list[dict[str, Any]] = []

    for product in products:

        match_score = calculate_match_score(
            product=product,
            query=query,
            category=category,
            min_price=min_price,
            max_price=max_price,
        )

        ranked.append(
            {
                **product,
                "match_score": match_score,
            }
        )

    ranked.sort(
        key=lambda item: (
            int(item.get("match_score") or 0),
            float(item.get("rating") or 0),
            int(item.get("review_count") or 0),
            int(item.get("stock") or 0),
        ),
        reverse=True,
    )

    return ranked


# ============================================================
# CART
# ============================================================

def get_cart(
    db: Session,
    user_id: int,
) -> dict[str, Any]:
    """
    Return a user's live backend cart.
    """

    cart_items = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == int(user_id),
        )
        .all()
    )

    items: list[dict[str, Any]] = []
    subtotal = 0.0

    for cart_item in cart_items:

        product = cart_item.product

        if not product:
            continue

        if not product.is_active:
            continue

        quantity = max(
            1,
            int(cart_item.quantity),
        )

        price = float(
            product.price
        )

        line_total = (
            price * quantity
        )

        subtotal += line_total

        items.append(
            {
                "id": int(product.id),
                "name": product.name,
                "category": product.category,
                "price": price,
                "quantity": quantity,
                "line_total": round(
                    line_total,
                    2,
                ),
                "image": product.image,
                "stock": int(product.stock),
            }
        )

    return {
        "items": items,
        "item_count": sum(
            item["quantity"]
            for item in items
        ),
        "subtotal": round(
            subtotal,
            2,
        ),
    }


# ============================================================
# COMPARE PRODUCTS
# ============================================================

def compare_products(
    db: Session,
    product_ids: list[int],
) -> list[dict[str, Any]]:
    """
    Return valid products for comparison.

    Invalid product IDs are ignored rather than fabricated.
    """

    products: list[dict[str, Any]] = []
    seen: set[int] = set()

    for product_id in product_ids:

        try:
            normalized_id = int(product_id)
        except (TypeError, ValueError):
            continue

        if normalized_id <= 0:
            continue

        if normalized_id in seen:
            continue

        product = get_product(
            db=db,
            product_id=normalized_id,
        )

        if product:
            products.append(product)
            seen.add(normalized_id)

    return products


# ============================================================
# COMPLEMENTARY PRODUCTS
# ============================================================

def get_complementary_products(
    db: Session,
    product: dict[str, Any],
    limit: int = 4,
) -> list[dict[str, Any]]:
    """
    Find sensible complementary products based on the
    product's logical commerce category.

    The recommendations are selected only from the real
    LUXORA catalog.
    """

    normalized_category = normalize_category(
        str(product.get("category") or "")
    )

    complementary_categories: dict[str, list[str]] = {
        "Timepieces": [
            "Accessories",
        ],
        "Accessories": [
            "Travel",
            "Timepieces",
            "Footwear",
        ],
        "Footwear": [
            "Accessories",
        ],
        "Travel": [
            "Accessories",
            "Footwear",
        ],
    }

    target_categories = complementary_categories.get(
        normalized_category or "",
        ["Accessories"],
    )

    result: list[dict[str, Any]] = []
    seen: set[int] = set()

    current_id = product.get("id")

    for target_category in target_categories:

        candidates = search_products(
            db=db,
            category=target_category,
        )

        ranked = rank_products(
            products=candidates,
            category=target_category,
        )

        for candidate in ranked:

            candidate_id = int(
                candidate["id"]
            )

            if (
                current_id is not None
                and candidate_id == int(current_id)
            ):
                continue

            if candidate_id in seen:
                continue

            seen.add(candidate_id)

            result.append(candidate)

            if len(result) >= limit:
                return result

    return result


# ============================================================
# CART COMPATIBILITY INSIGHTS
# ============================================================

def get_cart_recommendations(
    db: Session,
    user_id: int,
    limit: int = 4,
) -> list[dict[str, Any]]:
    """
    Find complementary products for everything currently
    inside the customer's cart.
    """

    cart = get_cart(
        db=db,
        user_id=user_id,
    )

    if not cart["items"]:
        return []

    recommendations: list[dict[str, Any]] = []
    seen: set[int] = set()

    for cart_item in cart["items"]:

        product = get_product(
            db=db,
            product_id=int(cart_item["id"]),
        )

        if not product:
            continue

        complementary = get_complementary_products(
            db=db,
            product=product,
            limit=limit,
        )

        for candidate in complementary:

            candidate_id = int(
                candidate["id"]
            )

            # Never recommend something already in cart.
            cart_ids = {
                int(item["id"])
                for item in cart["items"]
            }

            if candidate_id in cart_ids:
                continue

            if candidate_id in seen:
                continue

            seen.add(candidate_id)
            recommendations.append(candidate)

            if len(recommendations) >= limit:
                return recommendations

    return recommendations