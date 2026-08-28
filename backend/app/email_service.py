"""
Legacy module wrapper for email service functions.
Re-exports from app.services.email_service to maintain a single source of truth.
"""

from .services.email_service import (
    send_email,
    send_password_reset_email,
    send_order_confirmation_email,
)

__all__ = [
    "send_email",
    "send_password_reset_email",
    "send_order_confirmation_email",
]
