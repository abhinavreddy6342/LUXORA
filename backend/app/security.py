from __future__ import annotations

import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Callable

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .services.email_service import send_password_reset_email


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = os.getenv(
    "LUXORA_SECRET_KEY",
    "change-this-to-a-long-random-secret-key-for-luxora",
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60",
    )
)


# ============================================================
# PASSWORD RESET CONFIGURATION
# ============================================================

PASSWORD_RESET_OTP_EXPIRE_MINUTES = 10

PASSWORD_RESET_VERIFIED_EXPIRE_MINUTES = 10


# ============================================================
# PASSWORD RESET STORAGE
# ============================================================

_password_reset_sessions: dict[str, dict] = {}


# ============================================================
# PASSWORD HASHING
# ============================================================

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """
    Hash a plain-text password using Argon2.
    """
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    Verify a plain-text password against an Argon2 hash.
    """
    try:
        return password_hash.verify(
            plain_password,
            hashed_password,
        )
    except Exception:
        return False


# ============================================================
# OAUTH2
# ============================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
)


# ============================================================
# CREATE ACCESS TOKEN
# ============================================================

def create_access_token(
    user_id: int,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a JWT access token containing the user ID.
    """

    if expires_delta:
        expire = (
            datetime.now(timezone.utc)
            + expires_delta
        )
    else:
        expire = (
            datetime.now(timezone.utc)
            + timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )

    payload = {
        "sub": str(user_id),
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode the JWT and return the authenticated user.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials.",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if user is None:
        raise credentials_exception

    return user


# ============================================================
# ROLE AUTHORIZATION
# ============================================================

def require_role(
    *allowed_roles: str,
) -> Callable:
    """
    Create a dependency that allows only users with one
    of the supplied roles.

    Example:

        Depends(require_role("vendor"))

    or:

        Depends(require_role("admin", "vendor"))
    """

    normalized_roles = {
        str(role).strip().lower()
        for role in allowed_roles
        if str(role).strip()
    }

    if not normalized_roles:
        raise ValueError(
            "At least one allowed role is required."
        )

    def role_dependency(
        current_user: User = Depends(
            get_current_user
        ),
    ) -> User:
        user_role = str(
            getattr(
                current_user,
                "role",
                "customer",
            )
            or "customer"
        ).strip().lower()

        if user_role not in normalized_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You are not authorized "
                    "to access this area."
                ),
            )

        return current_user

    return role_dependency


# ============================================================
# CURRENT VENDOR
# ============================================================

def get_current_vendor(
    current_user: User = Depends(
        require_role("vendor")
    ),
) -> User:
    """
    Return the authenticated vendor.
    """

    return current_user


# ============================================================
# CURRENT ADMIN
# ============================================================

def get_current_admin(
    current_user: User = Depends(
        require_role("admin")
    ),
) -> User:
    """
    Return the authenticated administrator.
    """

    return current_user


# ============================================================
# PASSWORD RESET — GENERATE OTP
# ============================================================

def generate_password_reset_otp(
    email: str,
    db: Session,
) -> bool:
    """
    Generate a secure six-digit OTP and send it by email.
    """

    normalized_email = (
        str(email)
        .lower()
        .strip()
    )

    user = (
        db.query(User)
        .filter(
            User.email == normalized_email
        )
        .first()
    )

    # Never reveal whether an account exists.
    if user is None:
        return True

    otp = f"{secrets.randbelow(1_000_000):06d}"

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=PASSWORD_RESET_OTP_EXPIRE_MINUTES
        )
    )

    _password_reset_sessions[
        normalized_email
    ] = {
        "otp": otp,
        "expires_at": expires_at,
        "verified": False,
        "verified_expires_at": None,
    }

    email_sent = send_password_reset_email(
        recipient=normalized_email,
        otp=otp,
    )

    if not email_sent:
        _password_reset_sessions.pop(
            normalized_email,
            None,
        )

        return False

    return True


# ============================================================
# PASSWORD RESET — VERIFY OTP
# ============================================================

def verify_password_reset_otp(
    email: str,
    otp: str,
) -> bool:
    """
    Verify the six-digit password reset OTP.
    """

    normalized_email = (
        str(email)
        .lower()
        .strip()
    )

    normalized_otp = str(
        otp
    ).strip()

    session = _password_reset_sessions.get(
        normalized_email
    )

    if not session:
        return False

    now = datetime.now(timezone.utc)

    expires_at = session.get(
        "expires_at"
    )

    if (
        not expires_at
        or now > expires_at
    ):
        _password_reset_sessions.pop(
            normalized_email,
            None,
        )

        return False

    if (
        len(normalized_otp) != 6
        or not normalized_otp.isdigit()
    ):
        return False

    if not secrets.compare_digest(
        str(session.get("otp") or ""),
        normalized_otp,
    ):
        return False

    session["verified"] = True

    session["verified_expires_at"] = (
        now
        + timedelta(
            minutes=PASSWORD_RESET_VERIFIED_EXPIRE_MINUTES
        )
    )

    # Prevent OTP reuse.
    session["otp"] = None
    session["expires_at"] = None

    return True


# ============================================================
# PASSWORD RESET — CHANGE PASSWORD
# ============================================================

def reset_user_password(
    email: str,
    new_password: str,
    db: Session,
) -> bool:
    """
    Reset the password after successful OTP verification.
    """

    normalized_email = (
        str(email)
        .lower()
        .strip()
    )

    session = _password_reset_sessions.get(
        normalized_email
    )

    if not session:
        return False

    if not session.get(
        "verified",
        False,
    ):
        return False

    now = datetime.now(timezone.utc)

    verified_expires_at = session.get(
        "verified_expires_at"
    )

    if (
        not verified_expires_at
        or now > verified_expires_at
    ):
        _password_reset_sessions.pop(
            normalized_email,
            None,
        )

        return False

    user = (
        db.query(User)
        .filter(
            User.email == normalized_email
        )
        .first()
    )

    if user is None:
        _password_reset_sessions.pop(
            normalized_email,
            None,
        )

        return False

    if (
        not new_password
        or len(new_password) < 8
        or len(new_password) > 128
    ):
        return False

    user.password_hash = hash_password(
        new_password
    )

    user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    _password_reset_sessions.pop(
        normalized_email,
        None,
    )

    return True