"""
LUXORA email service.

The configured Gmail account is the sender.
The recipient is supplied by the caller and, for order
receipts, must be the authenticated customer's email.
"""

import os
import smtplib
from datetime import datetime
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from pathlib import Path

from dotenv import load_dotenv


# ============================================================
# ENVIRONMENT
# ============================================================

CURRENT_FILE = Path(__file__).resolve()

# backend/app/services/email_service.py
#                  ↑
# backend/app/services
# backend/app
# backend
BACKEND_ROOT = CURRENT_FILE.parent.parent.parent

BACKEND_ENV_FILE = BACKEND_ROOT / ".env"


def _load_environment():
    """
    Load environment variables without overriding values already
    supplied by Render or the operating environment.
    """

    load_dotenv(
        override=False
    )

    if BACKEND_ENV_FILE.exists():
        load_dotenv(
            dotenv_path=BACKEND_ENV_FILE,
            override=False,
        )


_load_environment()


# ============================================================
# ENVIRONMENT HELPER
# ============================================================

def _get_env(
    *names,
    default=None,
):
    """
    Return the first non-empty environment variable.
    """

    for name in names:
        value = os.getenv(name)

        if value is None:
            continue

        value = str(value).strip()

        if value:
            return value

    return default


# ============================================================
# SMTP CONFIGURATION
# ============================================================

def _get_smtp_config():
    """
    Resolve SMTP settings at the time the email is sent.

    This is important for cloud deployments such as Render.
    """

    _load_environment()

    host = _get_env(
        "EMAIL_HOST",
        "SMTP_HOST",
        "MAIL_HOST",
        default="smtp.gmail.com",
    )

    port_raw = _get_env(
        "EMAIL_PORT",
        "SMTP_PORT",
        "MAIL_PORT",
        default="587",
    )

    try:
        port = int(port_raw)
    except (
        TypeError,
        ValueError,
    ):
        port = 587

    username = _get_env(
        "EMAIL_USERNAME",
        "SMTP_USERNAME",
        "MAIL_USERNAME",
        "GMAIL_USER",
        "GMAIL_USERNAME",
    )

    password = _get_env(
        "EMAIL_PASSWORD",
        "SMTP_PASSWORD",
        "MAIL_PASSWORD",
        "GMAIL_PASS",
        "GMAIL_PASSWORD",
    )

    if password:
        # Google displays App Passwords with spaces sometimes.
        password = (
            password
            .replace(" ", "")
            .replace("\t", "")
            .strip()
        )

    from_address = _get_env(
        "EMAIL_FROM",
        "SMTP_FROM",
        "MAIL_FROM",
        default=username,
    )

    return {
        "host": host,
        "port": port,
        "username": username,
        "password": password,
        "from_address": from_address,
    }


# ============================================================
# GENERIC EMAIL
# ============================================================

def send_email(
    recipient: str,
    subject: str,
    body: str,
) -> bool:
    """
    Send a plain-text email through SMTP.

    Returns:
        True  -> SMTP accepted the message
        False -> email could not be submitted
    """

    config = _get_smtp_config()

    host = config["host"]
    port = config["port"]
    username = config["username"]
    password = config["password"]
    from_address = config["from_address"]

    clean_recipient = (
        str(recipient or "")
        .strip()
    )

    clean_subject = (
        str(subject or "")
        .strip()
    )

    clean_body = str(
        body or ""
    ).strip()

    if not username:
        print(
            "SMTP ERROR: sender username is missing."
        )
        return False

    if not password:
        print(
            "SMTP ERROR: sender password is missing."
        )
        return False

    if not from_address:
        print(
            "SMTP ERROR: sender address is missing."
        )
        return False

    if not clean_recipient:
        print(
            "SMTP ERROR: recipient address is missing."
        )
        return False

    if not clean_subject:
        print(
            "SMTP ERROR: email subject is missing."
        )
        return False

    # --------------------------------------------------------
    # BUILD MESSAGE
    # --------------------------------------------------------

    message = EmailMessage()

    message["From"] = formataddr(
        (
            "LUXORA",
            from_address,
        )
    )

    message["To"] = clean_recipient

    message["Subject"] = clean_subject

    message["Message-ID"] = make_msgid(
        domain=(
            from_address.split("@")[-1]
            if "@" in from_address
            else None
        )
    )

    message["X-LUXORA"] = (
        "LUXORA Order Receipt"
    )

    message.set_content(
        clean_body
    )

    # --------------------------------------------------------
    # PRIMARY ATTEMPT
    # --------------------------------------------------------

    try:
        if port == 465:
            with smtplib.SMTP_SSL(
                host,
                465,
                timeout=30,
            ) as server:
                server.ehlo()

                server.login(
                    username,
                    password,
                )

                server.send_message(
                    message,
                    from_addr=from_address,
                    to_addrs=[clean_recipient],
                )

        else:
            with smtplib.SMTP(
                host,
                port,
                timeout=30,
            ) as server:
                server.ehlo()

                server.starttls()

                server.ehlo()

                server.login(
                    username,
                    password,
                )

                server.send_message(
                    message,
                    from_addr=from_address,
                    to_addrs=[clean_recipient],
                )

        print(
            "SMTP SUCCESS: "
            f"receipt accepted for {clean_recipient}"
        )

        return True

    except Exception as primary_error:
        print(
            "SMTP PRIMARY ERROR: "
            f"{type(primary_error).__name__}: "
            f"{primary_error}"
        )

    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    fallback_port = (
        465
        if port != 465
        else 587
    )

    try:
        print(
            "SMTP FALLBACK: "
            f"trying port {fallback_port}"
        )

        if fallback_port == 465:
            with smtplib.SMTP_SSL(
                host,
                465,
                timeout=30,
            ) as server:
                server.ehlo()

                server.login(
                    username,
                    password,
                )

                server.send_message(
                    message,
                    from_addr=from_address,
                    to_addrs=[clean_recipient],
                )

        else:
            with smtplib.SMTP(
                host,
                587,
                timeout=30,
            ) as server:
                server.ehlo()

                server.starttls()

                server.ehlo()

                server.login(
                    username,
                    password,
                )

                server.send_message(
                    message,
                    from_addr=from_address,
                    to_addrs=[clean_recipient],
                )

        print(
            "SMTP FALLBACK SUCCESS: "
            f"receipt accepted for {clean_recipient}"
        )

        return True

    except Exception as fallback_error:
        print(
            "SMTP FALLBACK ERROR: "
            f"{type(fallback_error).__name__}: "
            f"{fallback_error}"
        )

        return False


# ============================================================
# PASSWORD RESET
# ============================================================

def send_password_reset_email(
    recipient: str,
    otp: str,
) -> bool:
    """
    Send password reset verification code.
    """

    subject = (
        "LUXORA — Password Reset Verification Code"
    )

    body = f"""
LUXORA
========================================

PASSWORD RESET VERIFICATION

Hello,

We received a request to reset your LUXORA account password.

Your verification code is:

{otp}

This code will expire soon.

If you did not request this password reset,
you can safely ignore this email.

Regards,
LUXORA
""".strip()

    return send_email(
        recipient=recipient,
        subject=subject,
        body=body,
    )


# ============================================================
# ORDER RECEIPT
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
    Send the LUXORA order confirmation/payment receipt.

    IMPORTANT:
    `recipient` is the customer's email.

    The configured SMTP account is ONLY the sender.
    """

    clean_recipient = (
        str(recipient or "")
        .strip()
        .lower()
    )

    clean_customer_email = (
        str(
            customer_email
            or clean_recipient
        )
        .strip()
        .lower()
    )

    clean_customer_name = (
        str(
            customer_name
            or "LUXORA Customer"
        )
        .strip()
    )

    clean_order_id = (
        str(order_id or "")
        .strip()
    )

    clean_payment_method = (
        str(
            payment_method
            or "Cash on Delivery"
        )
        .strip()
    )

    clean_status = (
        str(
            order_status
            or "confirmed"
        )
        .strip()
        .replace(
            "_",
            " ",
        )
        .title()
    )

    clean_address = (
        str(
            delivery_address
            or "Standard Delivery"
        )
        .strip()
    )

    clean_order_date = (
        str(order_date).strip()
        if order_date
        else datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    )

    # --------------------------------------------------------
    # PRODUCTS
    # --------------------------------------------------------

    item_lines = []

    for item in items or []:
        item_name = str(
            item.get(
                "name",
                "Product",
            )
        ).strip()

        try:
            unit_price = float(
                item.get(
                    "price",
                    0,
                )
            )
        except (
            TypeError,
            ValueError,
        ):
            unit_price = 0.0

        try:
            quantity = int(
                item.get(
                    "quantity",
                    1,
                )
            )
        except (
            TypeError,
            ValueError,
        ):
            quantity = 1

        quantity = max(
            1,
            quantity,
        )

        line_total = (
            unit_price * quantity
        )

        item_lines.append(
            (
                f"• {item_name}\n"
                f"  Quantity: {quantity}\n"
                f"  Unit Price: ₹{unit_price:,.2f}\n"
                f"  Line Total: ₹{line_total:,.2f}"
            )
        )

    items_text = (
        "\n\n".join(item_lines)
        if item_lines
        else "No items"
    )

    # --------------------------------------------------------
    # RECEIPT SUBJECT
    # --------------------------------------------------------

    subject = (
        "LUXORA — Order Confirmation & "
        f"Receipt #{clean_order_id}"
    )

    # --------------------------------------------------------
    # RECEIPT BODY
    # --------------------------------------------------------

    body = f"""
============================================================
                         L U X O R A
             ORDER CONFIRMATION & PAYMENT RECEIPT
============================================================

Hello {clean_customer_name},

Thank you for shopping with LUXORA.

Your order has been successfully confirmed.

------------------------------------------------------------
ORDER INFORMATION
------------------------------------------------------------

Brand:            LUXORA
Order ID:         {clean_order_id}
Order Date:       {clean_order_date}
Order Status:     {clean_status}
Payment Method:   {clean_payment_method}

------------------------------------------------------------
CUSTOMER INFORMATION
------------------------------------------------------------

Customer Name:    {clean_customer_name}
Customer Email:   {clean_customer_email}

------------------------------------------------------------
DELIVERY ADDRESS
------------------------------------------------------------

{clean_address}

------------------------------------------------------------
ORDERED PRODUCTS
------------------------------------------------------------

{items_text}

------------------------------------------------------------
PAYMENT SUMMARY
------------------------------------------------------------

Subtotal:         ₹{float(subtotal):,.2f}
Discount:        -₹{float(discount):,.2f}
Delivery Charge:  ₹{float(delivery_charge):,.2f}

------------------------------------------------------------
FINAL TOTAL:      ₹{float(total):,.2f}

------------------------------------------------------------

Your LUXORA order has been confirmed successfully.

Thank you for choosing LUXORA.

============================================================
                         LUXORA
              Elevated essentials for modern living.
============================================================
""".strip()

    # --------------------------------------------------------
    # FINAL CUSTOMER VALIDATION
    # --------------------------------------------------------

    if not clean_recipient:
        print(
            "ORDER RECEIPT ERROR: "
            "customer recipient email is empty."
        )
        return False

    # --------------------------------------------------------
    # SEND
    # --------------------------------------------------------

    return send_email(
        recipient=clean_recipient,
        subject=subject,
        body=body,
    )