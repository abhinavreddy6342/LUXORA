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

    The backend calculates the final amount, validates stock,
    stores the order, reduces stock and sends the confirmation
    email after a successful database commit.
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
        coupon_code = order_data.coupon_code.strip().upper()

        coupons = {
            "LUXORA10": 10,
            "WELCOME15": 15,
        }

        discount_percent = coupons.get(coupon_code)

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
        subtotal - discount + delivery_charge,
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
                "Cash on Delivery, UPI, Credit / Debit Card, Credit Card, Debit Card."
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
        delivery_charge=round(delivery_charge, 2),
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
    # COMMIT
    # --------------------------------------------------------

    try:
        db.commit()
        db.refresh(new_order)

    except Exception as error:
        db.rollback()

        print(
            f"Failed to create order for user "
            f"{current_user.id}: {error}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Could not create your order. "
                "Please try again."
            ),
        )

    # --------------------------------------------------------
    # SEND CONFIRMATION EMAIL
    # --------------------------------------------------------

    customer_name = (
        current_user.name.strip()
        if current_user.name
        else "LUXORA Customer"
    )

    address_str = (
        f"{address.name}\n"
        f"{address.address_line}\n"
        f"{address.city}, {address.state} - {address.postal_code}\n"
        f"Phone: {address.phone}"
    )

    order_date_str = (
        new_order.created_at.strftime("%Y-%m-%d %H:%M:%S")
        if new_order.created_at
        else None
    )

    email_sent = False

    try:
        email_sent = send_order_confirmation_email(
            recipient=current_user.email,
            order_id=f"LUX-{new_order.id:08d}",
            customer_name=customer_name,
            items=email_items,
            subtotal=float(new_order.subtotal),
            discount=float(new_order.discount),
            delivery_charge=float(
                new_order.delivery_charge
            ),
            total=float(new_order.total),
            payment_method=payment_method,
            order_date=order_date_str,
            customer_email=current_user.email,
            delivery_address=address_str,
            order_status=new_order.status,
        )

    except Exception as error:
        print(
            f"Order {new_order.id} was created, "
            f"but confirmation email failed: {error}"
        )

    if email_sent:
        print(
            f"Payment receipt sent successfully to "
            f"{current_user.email} for order "
            f"LUX-{new_order.id:08d}."
        )
    else:
        print(
            f"Order LUX-{new_order.id:08d} created successfully, "
            f"but receipt email could not be sent to "
            f"{current_user.email}."
        )

    new_order.email_sent = bool(email_sent)

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
        .order_by(Order.created_at.desc())
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

    new_status = new_status.strip().lower()

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