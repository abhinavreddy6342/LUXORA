from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
    UserCreate,
    UserResponse,
    VerifyResetCodeRequest,
    VerifyResetCodeResponse,
)
from ..security import (
    create_access_token,
    generate_password_reset_otp,
    get_current_user,
    hash_password,
    reset_user_password,
    verify_password,
    verify_password_reset_otp,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ============================================================
# REGISTER
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new LUXORA user account.
    """

    normalized_email = (
        str(user_data.email)
        .lower()
        .strip()
    )

    existing_user = (
        db.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this Gmail already exists.",
        )

    normalized_phone = user_data.phone.strip()

    existing_phone = (
        db.query(User)
        .filter(User.phone == normalized_phone)
        .first()
    )

    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this phone number already exists.",
        )

    new_user = User(
        name=user_data.name.strip(),
        email=normalized_email,
        phone=normalized_phone,
        password_hash=hash_password(
            user_data.password
        ),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Authenticate a LUXORA user and return a JWT access token.
    """

    normalized_email = (
        form_data.username
        .lower()
        .strip()
    )

    user = (
        db.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this Gmail address.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    if not verify_password(
        form_data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    access_token = create_access_token(
        user_id=user.id,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


# ============================================================
# FORGOT PASSWORD
# ============================================================

@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Generate a six-digit password-reset OTP and send it
    to the user's registered email address.

    The endpoint does not reveal whether an email exists.
    """

    normalized_email = (
        str(request.email)
        .lower()
        .strip()
    )

    try:
        email_sent = generate_password_reset_otp(
            email=normalized_email,
            db=db,
        )

    except Exception as error:
        print(
            f"Password reset email error: {error}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to send the verification code. "
                "Please try again later."
            ),
        )

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to send the verification code. "
                "Please try again later."
            ),
        )

    return {
        "message": (
            "If an account exists with this email address, "
            "a verification code has been sent."
        )
    }


# ============================================================
# VERIFY PASSWORD RESET CODE
# ============================================================

@router.post(
    "/verify-reset-code",
    response_model=VerifyResetCodeResponse,
)
def verify_reset_code(
    request: VerifyResetCodeRequest,
):
    """
    Verify the six-digit password-reset OTP.
    """

    normalized_email = (
        str(request.email)
        .lower()
        .strip()
    )

    is_valid = verify_password_reset_otp(
        email=normalized_email,
        otp=request.otp,
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    return {
        "message": "Verification code confirmed.",
    }


# ============================================================
# RESET PASSWORD
# ============================================================

@router.post(
    "/reset-password",
    response_model=ResetPasswordResponse,
)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Reset the user's password after OTP verification.
    """

    normalized_email = (
        str(request.email)
        .lower()
        .strip()
    )

    success = reset_user_password(
        email=normalized_email,
        new_password=request.new_password,
        db=db,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Password reset session is invalid or expired. "
                "Please request a new verification code."
            ),
        )

    return {
        "message": "Your password has been reset successfully.",
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    Return the currently authenticated LUXORA user.
    """

    return current_user