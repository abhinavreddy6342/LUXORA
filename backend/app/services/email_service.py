import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

from pathlib import Path

load_dotenv()

# Explicitly attempt loading .env from app directory or backend root directory
_app_env = Path(__file__).resolve().parent.parent / ".env"
if _app_env.exists():
    load_dotenv(dotenv_path=_app_env)

_backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
if _backend_env.exists():
    load_dotenv(dotenv_path=_backend_env)


# ============================================================
# SEND EMAIL
# ============================================================

def send_email(
    recipient: str,
    subject: str,
    body: str,
) -> bool:
    """
    Send a plain-text email using SMTP (Gmail or custom SMTP server).

    Returns:
        True  -> email sent successfully
        False -> email could not be sent
    """
    # Ensure fresh environment variable resolution
    load_dotenv()
    if _app_env.exists():
        load_dotenv(dotenv_path=_app_env)
    if _backend_env.exists():
        load_dotenv(dotenv_path=_backend_env)

    host = (
        os.getenv("EMAIL_HOST") or
        os.getenv("SMTP_HOST") or
        os.getenv("MAIL_HOST") or
        "smtp.gmail.com"
    ).strip()

    port_str = (
        os.getenv("EMAIL_PORT") or
        os.getenv("SMTP_PORT") or
        os.getenv("MAIL_PORT") or
        "587"
    ).strip()

    try:
        port = int(port_str)
    except (ValueError, TypeError):
        port = 587

    username = (
        os.getenv("EMAIL_USERNAME") or
        os.getenv("SMTP_USERNAME") or
        os.getenv("MAIL_USERNAME") or
        os.getenv("GMAIL_USER") or
        os.getenv("GMAIL_USERNAME")
    )
    if username:
        username = username.strip()

    password = (
        os.getenv("EMAIL_PASSWORD") or
        os.getenv("SMTP_PASSWORD") or
        os.getenv("MAIL_PASSWORD") or
        os.getenv("GMAIL_PASS") or
        os.getenv("GMAIL_PASSWORD")
    )
    if password:
        password = password.strip()

    from_addr = (
        os.getenv("EMAIL_FROM") or
        os.getenv("SMTP_FROM") or
        os.getenv("MAIL_FROM") or
        username
    )
    if from_addr:
        from_addr = from_addr.strip()

    if not username or not password:
        print(
            "Email configuration is missing. "
            "Set EMAIL_USERNAME & EMAIL_PASSWORD (or SMTP_USERNAME & SMTP_PASSWORD) in environment variables."
        )
        return False

    message = EmailMessage()
    message["From"] = from_addr
    message["To"] = recipient.strip()
    message["Subject"] = subject.strip()
    message.set_content(body)

    # Primary SMTP connection attempt
    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=15) as server:
                server.login(username, password)
                server.send_message(message)
        else:
            with smtplib.SMTP(host, port, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(username, password)
                server.send_message(message)

        print(f"Email sent successfully to {recipient}")
        return True

    except Exception as primary_error:
        print(
            f"Primary SMTP attempt (host={host}, port={port}) failed for recipient {recipient}: {primary_error}"
        )

        # Fallback attempt with alternate port (SSL 465 vs TLS 587)
        alt_port = 465 if port != 465 else 587
        try:
            print(f"Attempting fallback SMTP send (host={host}, port={alt_port})...")
            if alt_port == 465:
                with smtplib.SMTP_SSL(host, alt_port, timeout=15) as server:
                    server.login(username, password)
                    server.send_message(message)
            else:
                with smtplib.SMTP(host, alt_port, timeout=15) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(username, password)
                    server.send_message(message)

            print(f"Fallback email sent successfully to {recipient}")
            return True

        except Exception as fallback_error:
            print(
                f"Fallback SMTP attempt (host={host}, port={alt_port}) also failed for recipient {recipient}: {fallback_error}"
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