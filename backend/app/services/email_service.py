import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


EMAIL_HOST = os.getenv(
    "EMAIL_HOST",
    "smtp.gmail.com",
)

EMAIL_PORT = int(
    os.getenv(
        "EMAIL_PORT",
        "587",
    )
)

EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")

EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

EMAIL_FROM = os.getenv(
    "EMAIL_FROM",
    EMAIL_USERNAME,
)


# ============================================================
# SEND EMAIL
# ============================================================

def send_email(
    recipient: str,
    subject: str,
    body: str,
) -> bool:
    """
    Send a plain-text email using Gmail SMTP.

    Returns:
        True  -> email sent successfully
        False -> email could not be sent
    """

    if not EMAIL_USERNAME or not EMAIL_PASSWORD:
        print(
            "Email configuration is missing. "
            "Check EMAIL_USERNAME and EMAIL_PASSWORD in .env."
        )

        return False

    try:
        message = EmailMessage()

        message["From"] = EMAIL_FROM
        message["To"] = recipient
        message["Subject"] = subject

        message.set_content(body)

        with smtplib.SMTP(
            EMAIL_HOST,
            EMAIL_PORT,
        ) as server:

            server.ehlo()

            server.starttls()

            server.ehlo()

            server.login(
                EMAIL_USERNAME,
                EMAIL_PASSWORD,
            )

            server.send_message(message)

        print(
            f"Email sent successfully to {recipient}"
        )

        return True

    except Exception as error:
        print(
            f"Failed to send email to {recipient}: {error}"
        )

        return False


# ============================================================
# PASSWORD RESET EMAIL
# ============================================================

def send_password_reset_email(
    recipient: str,
    otp: str,
) -> bool:
    """
    Send a password-reset verification code.
    """

    subject = (
        "LUXORA — Password Reset Verification Code"
    )

    body = f"""
Hello,

We received a request to reset your LUXORA account password.

Your verification code is:

{otp}

This code will expire soon.

If you did not request a password reset, you can safely ignore this email.

Regards,
LUXORA
"""

    return send_email(
        recipient=recipient,
        subject=subject,
        body=body.strip(),
    )


# ============================================================
# ORDER CONFIRMATION EMAIL
# ============================================================

def send_order_confirmation_email(
    recipient: str,
    order_id: str,
    customer_name: str,
    items: list[dict],
    subtotal: float,
    discount: float,
    delivery_charge: float,
    total: float,
    payment_method: str,
    order_date: str | None = None,
    customer_email: str | None = None,
    delivery_address: str | None = None,
    order_status: str = "confirmed",
) -> bool:
    """
    Send an order confirmation and receipt email.
    """
    from datetime import datetime

    email_address = customer_email or recipient
    formatted_date = order_date or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_status = (order_status or "confirmed").title()
    formatted_address = delivery_address or "Standard Delivery"

    item_lines = []
    for item in items:
        unit_price = float(item.get("price", 0))
        qty = int(item.get("quantity", 1))
        item_total = unit_price * qty
        item_name = item.get("name", "Product")
        item_lines.append(
            f"  • {item_name}\n"
            f"    Quantity: {qty}  |  Unit Price: ₹{unit_price:,.2f}  |  Line Total: ₹{item_total:,.2f}"
        )

    items_text = "\n\n".join(item_lines) if item_lines else "  No items"

    subject = f"LUXORA — Order Confirmation & Receipt #{order_id}"

    body = f"""
============================================================
                        L U X O R A
                 ORDER CONFIRMATION & RECEIPT
============================================================

Hello {customer_name},

Thank you for shopping with LUXORA.
Your order has been placed successfully and is now confirmed.

------------------------------------------------------------
1. ORDER SUMMARY
------------------------------------------------------------
Brand:            LUXORA
Order ID:         {order_id}
Order Date:       {formatted_date}
Order Status:     {formatted_status}
Payment Method:   {payment_method}

------------------------------------------------------------
2. CUSTOMER DETAILS
------------------------------------------------------------
Customer Name:    {customer_name}
Customer Email:   {email_address}

------------------------------------------------------------
3. DELIVERY ADDRESS
------------------------------------------------------------
{formatted_address}

------------------------------------------------------------
4. ORDERED PRODUCTS
------------------------------------------------------------
{items_text}

------------------------------------------------------------
5. PAYMENT & PRICE DETAILS
------------------------------------------------------------
Subtotal:         ₹{subtotal:,.2f}
Discount:        -₹{discount:,.2f}
Delivery Charge:  ₹{delivery_charge:,.2f}
------------------------------------------------------------
FINAL TOTAL:      ₹{total:,.2f}

============================================================
Thank you for choosing LUXORA.
If you have any questions, please contact customer support.
============================================================
"""

    return send_email(
        recipient=recipient,
        subject=subject,
        body=body.strip(),
    )