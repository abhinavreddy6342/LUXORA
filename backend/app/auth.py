from datetime import datetime, timedelta, timezone
import secrets

from jose import JWTError, jwt
from pwdlib import PasswordHash
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .services.email_service import send_password_reset_email


# ============================================================
# AUTHENTICATION SETTINGS
# ============================================================

SECRET_KEY = "change-this-to-a-long-random-secret-key-for-luxora"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ============================================================
# PASSWORD RESET SETTINGS
# ============================================================

# OTP validity period.
PASSWORD_RESET_OTP_EXPIRE_MINUTES = 10

# Maximum number of verification attempts for one OTP.
PASSWORD_RESET_MAX_ATTEMPTS = 5


# Temporary in-memory password reset storage.
#
# Structure:
# {
#     "email@example.com": {
#         "otp": "123456",
#         "expires_at": datetime,
#         "attempts": 0,
#     }
# }
#
# This is suitable for the current development/single-server
# version of LUXORA.
#
# For production with multiple backend instances, move this
# information to Redis or a database table.
password_reset_store: dict[str, dict] = {}


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

    return password_hash.verify(
        plain_password,
        hashed_password,
    )


# ============================================================
# JWT
# ============================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


def create_access_token(
    user_id: int,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a JWT access token.
    """

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
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
# CURRENT USER
# ============================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Read the JWT token and return the authenticated user.
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

        user_id = int(user_id)

    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise credentials_exception

    return user


# ============================================================
# PASSWORD RESET — GENERATE OTP
# ============================================================

def generate_password_reset_otp(
    email: str,
    db: Session,
) -> bool:
    """
    Generate a six-digit password-reset OTP and send it
    to the user's registered email address.

    Returns:
        True if the OTP email was sent.
        False if the email could not be sent.

    Important:
        The function intentionally does not reveal whether
        an email belongs to a LUXORA account.
    """

    normalized_email = email.strip().lower()

    user = (
        db.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    # Do not reveal whether the account exists.
    if user is None:
        return True

    # --------------------------------------------------------
    # Generate secure six-digit OTP
    # --------------------------------------------------------

    otp = f"{secrets.randbelow(1_000_000):06d}"

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=PASSWORD_RESET_OTP_EXPIRE_MINUTES
        )
    )

    password_reset_store[normalized_email] = {
        "otp": otp,
        "expires_at": expires_at,
        "attempts": 0,
    }

    # --------------------------------------------------------
    # Send OTP email
    # --------------------------------------------------------

    email_sent = send_password_reset_email(
        recipient=user.email,
        otp=otp,
    )

    # If email delivery fails, remove the stored OTP.
    if not email_sent:
        password_reset_store.pop(
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
    Verify a password-reset OTP.

    Returns:
        True if the OTP is valid.
        False otherwise.
    """

    normalized_email = email.strip().lower()
    submitted_otp = str(otp).strip()

    reset_data = password_reset_store.get(
        normalized_email
    )

    if reset_data is None:
        return False

    # --------------------------------------------------------
    # Check expiration
    # --------------------------------------------------------

    now = datetime.now(timezone.utc)

    expires_at = reset_data.get("expires_at")

    if not isinstance(expires_at, datetime):
        password_reset_store.pop(
            normalized_email,
            None,
        )

        return False

    if now >= expires_at:
        password_reset_store.pop(
            normalized_email,
            None,
        )

        return False

    # --------------------------------------------------------
    # Check maximum attempts
    # --------------------------------------------------------

    attempts = int(
        reset_data.get("attempts", 0)
    )

    if attempts >= PASSWORD_RESET_MAX_ATTEMPTS:
        password_reset_store.pop(
            normalized_email,
            None,
        )

        return False

    # --------------------------------------------------------
    # Verify OTP
    # --------------------------------------------------------

    if not secrets.compare_digest(
        str(reset_data.get("otp", "")),
        submitted_otp,
    ):
        reset_data["attempts"] = attempts + 1

        if (
            reset_data["attempts"]
            >= PASSWORD_RESET_MAX_ATTEMPTS
        ):
            password_reset_store.pop(
                normalized_email,
                None,
            )

        return False

    # --------------------------------------------------------
    # OTP is valid
    #
    # Keep the record temporarily so the reset-password
    # endpoint can confirm that OTP verification succeeded.
    # --------------------------------------------------------

    reset_data["verified"] = True

    return True


# ============================================================
# PASSWORD RESET — RESET PASSWORD
# ============================================================

def reset_user_password(
    email: str,
    new_password: str,
    db: Session,
) -> bool:
    """
    Change the user's password after successful OTP
    verification.

    Returns:
        True if the password was changed.
        False if the reset session is invalid.
    """

    normalized_email = email.strip().lower()

    reset_data = password_reset_store.get(
        normalized_email
    )

    if reset_data is None:
        return False

    # --------------------------------------------------------
    # Verify that the OTP was already verified
    # --------------------------------------------------------

    if not reset_data.get("verified", False):
        return False

    # --------------------------------------------------------
    # Check expiration again
    # --------------------------------------------------------

    now = datetime.now(timezone.utc)

    expires_at = reset_data.get("expires_at")

    if not isinstance(expires_at, datetime):
        password_reset_store.pop(
            normalized_email,
            None,
        )

        return False

    if now >= expires_at:
        password_reset_store.pop(
            normalized_email,
            None,
        )

        return False

    # --------------------------------------------------------
    # Find user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    if user is None:
        password_reset_store.pop(
            normalized_email,
            None,
        )

        return False

    # --------------------------------------------------------
    # Update password
    # --------------------------------------------------------

    user.password_hash = hash_password(
        new_password
    )

    user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    # --------------------------------------------------------
    # OTP becomes invalid after password reset
    # --------------------------------------------------------

    password_reset_store.pop(
        normalized_email,
        None,
    )

    return True