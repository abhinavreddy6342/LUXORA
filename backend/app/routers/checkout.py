from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Address, CartItem, Order, OrderItem, Product, User
from ..services.email_service import send_order_confirmation_email
from ..schemas import OrderResponse


router = APIRouter(
    prefix="/checkout",
    tags=["Checkout"],
)


# ============================================================
# CHECKOUT REQUEST
# ============================================================

class CheckoutRequest(BaseModel):
    address_id: int | None = None

    first_name: str
    last_name: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str

    coupon_code: str | None = None


# ============================================================
# CHECKOUT
# ============================================================

@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def checkout(
    checkout_data: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Complete checkout for the authenticated user.

    Flow:

    Checkout
        ↓
    Validate delivery details
        ↓
    Validate cart
        ↓
    Validate products & stock
        ↓
    Calculate subtotal
        ↓
    Apply coupon
        ↓
    Calculate delivery
        ↓
    Create delivery address
        ↓
    Create order
        ↓
    Create order items
        ↓
    Reduce stock
        ↓
    Clear cart
        ↓
    Commit transaction
        ↓
    Send order/payment receipt email
    """

    # --------------------------------------------------------
    # Validate delivery information
    # --------------------------------------------------------

    first_name = checkout_data.first_name.strip()
    last_name = checkout_data.last_name.strip()
    phone = checkout_data.phone.strip()
    address_text = checkout_data.address.strip()
    city = checkout_data.city.strip()
    state = checkout_data.state.strip()
    pincode = checkout_data.pincode.strip()

    if len(first_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid first name.",
        )

    if len(last_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid last name.",
        )

    if not phone.isdigit() or len(phone) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid 10-digit phone number.",
        )

    if len(address_text) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a complete delivery address.",
        )

    if not city:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter your city.",
        )

    if not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter your state.",
        )

    if not pincode.isdigit() or len(pincode) != 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid 6-digit PIN code.",
        )

    # --------------------------------------------------------
    # Get current user's cart
    # --------------------------------------------------------

    cart_items = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
        )
        .all()
    )

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty.",
        )

    # --------------------------------------------------------
    # Validate products and stock
    # --------------------------------------------------------

    subtotal = 0.0
    checkout_items = []

    for cart_item in cart_items:

        product = (
            db.query(Product)
            .filter(
                Product.id == cart_item.product_id,
                Product.is_active.is_(True),
            )
            .first()
        )

        if not product:
            from ..seed import seed_initial_products
            seed_initial_products(db)
            product = (
                db.query(Product)
                .filter(
                    Product.id == cart_item.product_id,
                    Product.is_active.is_(True),
                )
                .first()
            )

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Product {cart_item.product_id} "
                    "is no longer available."
                ),
            )

        if cart_item.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid quantity for "
                    f"'{product.name}'."
                ),
            )

        if cart_item.quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for "
                    f"'{product.name}'. "
                    f"Available stock: {product.stock}."
                ),
            )

        item_total = float(product.price) * cart_item.quantity

        subtotal += item_total

        checkout_items.append(
            {
                "product": product,
                "quantity": cart_item.quantity,
            }
        )

    # --------------------------------------------------------
    # Coupon
    # --------------------------------------------------------

    discount = 0.0
    coupon_code = None

    if checkout_data.coupon_code:

        coupon_code = (
            checkout_data.coupon_code
            .strip()
            .upper()
        )

        if coupon_code == "LUXORA10":

            discount = round(
                subtotal * 0.10,
                2,
            )

        elif coupon_code != "":

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid coupon code.",
            )

    # --------------------------------------------------------
    # Delivery charge
    # --------------------------------------------------------

    delivery_charge = 0.0

    if subtotal < 1000:
        delivery_charge = 50.0

    # --------------------------------------------------------
    # Final total
    # --------------------------------------------------------

    total = round(
        subtotal - discount + delivery_charge,
        2,
    )

    # --------------------------------------------------------
    # Create delivery address
    #
    # We create an address snapshot for this order so that
    # the order always has the delivery information used
    # when the customer placed it.
    # --------------------------------------------------------

    full_name = f"{first_name} {last_name}".strip()

    new_address = Address(
        user_id=current_user.id,
        name=full_name,
        phone=phone,
        address_line=address_text,
        city=city,
        state=state,
        postal_code=pincode,
        country="India",
        is_default=False,
    )

    db.add(new_address)
    db.flush()

    # --------------------------------------------------------
    # Create order
    # --------------------------------------------------------

    new_order = Order(
        user_id=current_user.id,
        address_id=new_address.id,
        subtotal=subtotal,
        discount=discount,
        delivery_charge=delivery_charge,
        total=total,
        coupon_code=coupon_code,
        status="pending",
    )

    db.add(new_order)
    db.flush()

    # --------------------------------------------------------
    # Create order items and reduce stock
    # --------------------------------------------------------

    email_items = []

    for item_data in checkout_items:

        product = item_data["product"]
        quantity = item_data["quantity"]

        order_item = OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            product_name=product.name,
            price=product.price,
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
    # Clear cart
    # --------------------------------------------------------

    db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
    ).delete(
        synchronize_session=False,
    )

    # --------------------------------------------------------
    # Commit order transaction
    # --------------------------------------------------------

    try:

        db.commit()

        db.refresh(new_order)

    except Exception as error:

        db.rollback()

        print(
            f"Checkout failed for user "
            f"{current_user.id}: {error}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Checkout failed. "
                "Please try again."
            ),
        )

    # ========================================================
    # SEND PAYMENT / ORDER RECEIPT EMAIL
    # ========================================================

    customer_name = (
        current_user.name.strip()
        if current_user.name
        else full_name
    )

    address_str = (
        f"{full_name}\n"
        f"{address_text}\n"
        f"{city}, {state} - {pincode}\n"
        f"Phone: {phone}"
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
            delivery_charge=float(new_order.delivery_charge),
            total=float(new_order.total),
            payment_method="Cash on Delivery",
            order_date=order_date_str,
            customer_email=current_user.email,
            delivery_address=address_str,
            order_status=new_order.status,
        )
    except Exception as error:
        print(f"Order receipt email error for LUX-{new_order.id:08d}: {error}")

    # --------------------------------------------------------
    # Email failure must NOT cancel a successful order
    # --------------------------------------------------------

    if email_sent:
        print(
            f"Order receipt sent successfully to "
            f"{current_user.email} "
            f"for order LUX-{new_order.id:08d}."
        )
    else:
        print(
            f"Order LUX-{new_order.id:08d} was created "
            f"successfully, but the receipt email "
            f"could not be sent to "
            f"{current_user.email}."
        )

    new_order.email_sent = bool(email_sent)

    # --------------------------------------------------------
    # Return order
    # --------------------------------------------------------

    return new_order