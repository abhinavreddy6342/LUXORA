import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .services.email_service import send_password_reset_email


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = "change-this-to-a-long-random-secret-key-for-luxora"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ============================================================
# PASSWORD RESET CONFIGURATION
# ============================================================

PASSWORD_RESET_OTP_EXPIRE_MINUTES = 10

PASSWORD_RESET_VERIFIED_EXPIRE_MINUTES = 10


# ============================================================
# PASSWORD RESET STORAGE
# ============================================================
#
# Temporary in-memory storage.
#
# Structure:
#
# {
#     "user@gmail.com": {
#         "otp": "123456",
#         "expires_at": datetime(...),
#         "verified": False,
#         "verified_expires_at": None,
#     }
# }
#
# This is suitable for the current LUXORA development version.
# For production with multiple servers, this should be moved
# to Redis or a database table.
#

_password_reset_sessions = {}


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
# GENERATE PASSWORD RESET OTP
# ============================================================

def generate_password_reset_otp(
    email: str,
    db: Session,
) -> bool:
    """
    Generate a six-digit OTP and send it to the user's
    registered email address.

    Returns:
        True  -> email sent successfully
        False -> email could not be sent
    """

    normalized_email = (
        str(email)
        .lower()
        .strip()
    )

    # --------------------------------------------------------
    # Find user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    # --------------------------------------------------------
    # Do not reveal whether the account exists.
    #
    # Returning True here also prevents email enumeration
    # through different API responses.
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Store OTP temporarily
    # --------------------------------------------------------

    _password_reset_sessions[normalized_email] = {
        "otp": otp,
        "expires_at": expires_at,
        "verified": False,
        "verified_expires_at": None,
    }

    # --------------------------------------------------------
    # Send email
    # --------------------------------------------------------

    email_sent = send_password_reset_email(
        recipient=normalized_email,
        otp=otp,
    )

    # --------------------------------------------------------
    # Remove session if email failed
    # --------------------------------------------------------

    if not email_sent:
        _password_reset_sessions.pop(
            normalized_email,
            None,
        )

        return False

    return True


# ============================================================
# VERIFY PASSWORD RESET OTP
# ============================================================

def verify_password_reset_otp(
    email: str,
    otp: str,
) -> bool:
    """
    Verify the six-digit password-reset OTP.

    The OTP expires after
    PASSWORD_RESET_OTP_EXPIRE_MINUTES.
    """

    normalized_email = (
        str(email)
        .lower()
        .strip()
    )

    normalized_otp = str(otp).strip()

    session = _password_reset_sessions.get(
        normalized_email
    )

    if not session:
        return False

    # --------------------------------------------------------
    # Check OTP expiration
    # --------------------------------------------------------

    now = datetime.now(timezone.utc)

    expires_at = session.get("expires_at")

    if not expires_at or now > expires_at:
        _password_reset_sessions.pop(
            normalized_email,
            None,
        )

        return False

    # --------------------------------------------------------
    # Validate OTP format
    # --------------------------------------------------------

    if (
        len(normalized_otp) != 6
        or not normalized_otp.isdigit()
    ):
        return False

    # --------------------------------------------------------
    # Compare OTP
    # --------------------------------------------------------

    if not secrets.compare_digest(
        session.get("otp", ""),
        normalized_otp,
    ):
        return False

    # --------------------------------------------------------
    # Mark OTP as verified
    # --------------------------------------------------------

    verified_expires_at = (
        now
        + timedelta(
            minutes=PASSWORD_RESET_VERIFIED_EXPIRE_MINUTES
        )
    )

    session["verified"] = True
    session["verified_expires_at"] = (
        verified_expires_at
    )

    # OTP should not be reusable.
    session["otp"] = None
    session["expires_at"] = None

    return True


# ============================================================
# RESET USER PASSWORD
# ============================================================

def reset_user_password(
    email: str,
    new_password: str,
    db: Session,
) -> bool:
    """
    Reset the user's password after successful OTP
    verification.
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

    # --------------------------------------------------------
    # Verify that the OTP was successfully verified
    # --------------------------------------------------------

    if not session.get("verified"):
        return False

    # --------------------------------------------------------
    # Check verification expiration
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Find user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    if user is None:
        _password_reset_sessions.pop(
            normalized_email,
            None,
        )

        return False

    # --------------------------------------------------------
    # Validate new password
    # --------------------------------------------------------

    if not new_password:
        return False

    if len(new_password) < 8:
        return False

    if len(new_password) > 128:
        return False

    # --------------------------------------------------------
    # Hash new password
    # --------------------------------------------------------

    user.password_hash = hash_password(
        new_password
    )

    # --------------------------------------------------------
    # Save new password
    # --------------------------------------------------------

    db.commit()
    db.refresh(user)

    # --------------------------------------------------------
    # Delete reset session.
    #
    # This prevents the same verified session from being
    # reused to change the password again.
    # --------------------------------------------------------

    _password_reset_sessions.pop(
        normalized_email,
        None,
    )

    return True


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode the JWT token and return the authenticated user.
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

    # --------------------------------------------------------
    # Find user in database
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise credentials_exception

    return user