from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Address, Order, OrderItem, Product, User
from ..schemas import OrderCreate, OrderResponse
from ..services.email_service import send_order_confirmation_email


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


# ============================================================
# CREATE ORDER
# ============================================================

@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create an order for the authenticated user.

    The backend:
    - validates the delivery address
    - validates products and stock
    - calculates the final order amount
    - creates the order
    - reduces stock
    - sends the order receipt to the authenticated
      user's registered email address
    """

    # --------------------------------------------------------
    # VALIDATE ADDRESS
    # --------------------------------------------------------

    address = (
        db.query(Address)
        .filter(
            Address.id == order_data.address_id,
            Address.user_id == current_user.id,
        )
        .first()
    )

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found.",
        )

    # --------------------------------------------------------
    # VALIDATE ITEMS
    # --------------------------------------------------------

    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item.",
        )

    # --------------------------------------------------------
    # VALIDATE PRODUCTS + STOCK
    # --------------------------------------------------------

    subtotal = 0.0
    order_items_data = []

    for item in order_data.items:
        product = (
            db.query(Product)
            .filter(
                Product.id == item.product_id,
                Product.is_active.is_(True),
            )
            .first()
        )

        # Existing production safety fallback
        if not product:
            try:
                from ..seed import seed_initial_products

                seed_initial_products(db)

                product = (
                    db.query(Product)
                    .filter(
                        Product.id == item.product_id,
                        Product.is_active.is_(True),
                    )
                    .first()
                )
            except Exception as seed_error:
                print(
                    f"Product seeding fallback failed: "
                    f"{type(seed_error).__name__}: {seed_error}"
                )

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found.",
            )

        quantity = int(item.quantity)

        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product quantity must be greater than zero.",
            )

        if product.stock < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for '{product.name}'. "
                    f"Available stock: {product.stock}."
                ),
            )

        item_total = float(product.price) * quantity
        subtotal += item_total

        order_items_data.append(
            {
                "product": product,
                "quantity": quantity,
            }
        )

    # --------------------------------------------------------
    # COUPON
    # --------------------------------------------------------

    discount = 0.0
    coupon_code = None

    if order_data.coupon_code:
        coupon_code = (
            order_data.coupon_code.strip().upper()
        )

        coupons = {
            "LUXORA10": 10,
            "WELCOME15": 15,
        }

        discount_percent = coupons.get(
            coupon_code
        )

        if discount_percent:
            discount = subtotal * (
                discount_percent / 100
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid coupon code.",
            )

    # --------------------------------------------------------
    # DELIVERY
    # --------------------------------------------------------

    effective_subtotal = max(
        0.0,
        subtotal - discount,
    )

    delivery_charge = (
        0.0
        if effective_subtotal >= 999
        else 79.0
    )

    # --------------------------------------------------------
    # FINAL TOTAL
    # --------------------------------------------------------

    total = max(
        0.0,
        subtotal
        - discount
        + delivery_charge,
    )

    # --------------------------------------------------------
    # PAYMENT METHOD
    # --------------------------------------------------------

    payment_method = (
        order_data.payment_method.strip()
        if order_data.payment_method
        else "Cash on Delivery"
    )

    allowed_payment_methods = {
        "Cash on Delivery",
        "UPI",
        "Credit / Debit Card",
        "Credit Card",
        "Debit Card",
    }

    if payment_method not in allowed_payment_methods:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid payment method. Allowed values: "
                "Cash on Delivery, UPI, Credit / Debit Card, "
                "Credit Card, Debit Card."
            ),
        )

    # --------------------------------------------------------
    # CREATE ORDER
    # --------------------------------------------------------

    new_order = Order(
        user_id=current_user.id,
        address_id=address.id,
        subtotal=round(subtotal, 2),
        discount=round(discount, 2),
        delivery_charge=round(
            delivery_charge,
            2,
        ),
        total=round(total, 2),
        coupon_code=coupon_code,
        payment_method=payment_method,
        status="confirmed",
    )

    db.add(new_order)
    db.flush()

    # --------------------------------------------------------
    # CREATE ORDER ITEMS + REDUCE STOCK
    # --------------------------------------------------------

    email_items = []

    for item_data in order_items_data:
        product = item_data["product"]
        quantity = item_data["quantity"]

        order_item = OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            product_name=product.name,
            price=float(product.price),
            quantity=quantity,
        )

        db.add(order_item)

        product.stock -= quantity

        email_items.append(
            {
                "name": product.name,
                "price": float(product.price),
                "quantity": quantity,
            }
        )

    # --------------------------------------------------------
    # COMMIT ORDER
    # --------------------------------------------------------

    try:
        db.commit()
        db.refresh(new_order)

    except Exception as error:
        db.rollback()

        print(
            f"Failed to create order for user "
            f"{current_user.id}: "
            f"{type(error).__name__}: {error}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Could not create your order. "
                "Please try again."
            ),
        )

    # --------------------------------------------------------
    # CUSTOMER EMAIL
    # --------------------------------------------------------

    customer_email = (
        str(current_user.email)
        .strip()
        .lower()
    )

    if not customer_email:
        print(
            f"Order {new_order.id} created, "
            "but authenticated user has no email address."
        )

    customer_name = (
        current_user.name.strip()
        if current_user.name
        else "LUXORA Customer"
    )

    # --------------------------------------------------------
    # DELIVERY ADDRESS
    # --------------------------------------------------------

    delivery_address = (
        f"{address.name}\n"
        f"{address.address_line}\n"
        f"{address.city}, "
        f"{address.state} - "
        f"{address.postal_code}\n"
        f"Phone: {address.phone}"
    )

    # --------------------------------------------------------
    # ORDER DATE
    # --------------------------------------------------------

    order_date = None

    if new_order.created_at:
        order_date = new_order.created_at.strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    # --------------------------------------------------------
    # SEND RECEIPT EMAIL
    # --------------------------------------------------------

    email_sent = False

    try:
        print(
            "LUXORA RECEIPT EMAIL START"
        )

        print(
            f"Customer ID: {current_user.id}"
        )

        print(
            f"Customer Email: {customer_email}"
        )

        print(
            f"Order ID: LUX-{new_order.id:08d}"
        )

        email_sent = send_order_confirmation_email(
            # IMPORTANT:
            # This is the purchaser's email.
            recipient=customer_email,

            order_id=(
                f"LUX-{new_order.id:08d}"
            ),

            customer_name=customer_name,

            items=email_items,

            subtotal=float(
                new_order.subtotal
            ),

            discount=float(
                new_order.discount
            ),

            delivery_charge=float(
                new_order.delivery_charge
            ),

            total=float(
                new_order.total
            ),

            payment_method=payment_method,

            order_date=order_date,

            customer_email=customer_email,

            delivery_address=delivery_address,

            order_status=new_order.status,
        )

    except Exception as error:
        print(
            "LUXORA RECEIPT EMAIL EXCEPTION: "
            f"{type(error).__name__}: {error}"
        )

        email_sent = False

    # --------------------------------------------------------
    # EMAIL RESULT
    # --------------------------------------------------------

    if email_sent:
        print(
            "LUXORA RECEIPT EMAIL SUCCESS"
        )

        print(
            f"FROM: configured LUXORA sender"
        )

        print(
            f"TO: {customer_email}"
        )

        print(
            f"ORDER: LUX-{new_order.id:08d}"
        )

    else:
        print(
            "LUXORA RECEIPT EMAIL FAILED"
        )

        print(
            f"INTENDED RECIPIENT: {customer_email}"
        )

        print(
            f"ORDER: LUX-{new_order.id:08d}"
        )

    # --------------------------------------------------------
    # RETURN ORDER
    # --------------------------------------------------------

    return new_order


# ============================================================
# GET ALL ORDERS
# ============================================================

@router.get(
    "",
    response_model=list[OrderResponse],
)
def get_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Order)
        .filter(
            Order.user_id == current_user.id
        )
        .order_by(
            Order.created_at.desc()
        )
        .all()
    )


# ============================================================
# GET SINGLE ORDER
# ============================================================

@router.get(
    "/{order_id}",
    response_model=OrderResponse,
)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    return order


# ============================================================
# UPDATE ORDER STATUS
# ============================================================

@router.put(
    "/{order_id}/status",
    response_model=OrderResponse,
)
def update_order_status(
    order_id: int,
    new_status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed_statuses = {
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
    }

    new_status = (
        new_status
        .strip()
        .lower()
    )

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid order status. Allowed values: "
                "pending, confirmed, processing, shipped, "
                "delivered, cancelled."
            ),
        )

    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    order.status = new_status

    db.commit()
    db.refresh(order)

    return order