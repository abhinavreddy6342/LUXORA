from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, VendorProfile
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
    VendorAuthResponse,
    VendorRegister,
    VendorProfileResponse,
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
# REGISTER CUSTOMER
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

    normalized_phone = (
        user_data.phone.strip()
    )

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
        role="customer",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ============================================================
# CUSTOMER LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
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
            detail="Incorrect email or password.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    if str(user.role).lower() == "vendor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "This is a business account. "
                "Please use the LUXORA business login."
            ),
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
# VENDOR REGISTER
# ============================================================

@router.post(
    "/vendor/register",
    response_model=VendorAuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def vendor_register(
    vendor_data: VendorRegister,
    db: Session = Depends(get_db),
):
    normalized_email = (
        str(vendor_data.email)
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

    normalized_phone = (
        vendor_data.phone.strip()
    )

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

    vendor_user = User(
        name=vendor_data.owner_name.strip(),
        email=normalized_email,
        phone=normalized_phone,
        password_hash=hash_password(
            vendor_data.password
        ),
        role="vendor",
    )

    db.add(vendor_user)
    db.flush()

    vendor_profile = VendorProfile(
        user_id=vendor_user.id,
        business_name=vendor_data.business_name.strip(),
        business_email=normalized_email,
        business_phone=normalized_phone,
        business_description=(
            vendor_data.business_description.strip()
            if vendor_data.business_description
            else None
        ),
        business_address=(
            vendor_data.business_address.strip()
            if vendor_data.business_address
            else None
        ),
        status="active",
    )

    db.add(vendor_profile)
    db.commit()

    db.refresh(vendor_user)
    db.refresh(vendor_profile)

    access_token = create_access_token(
        user_id=vendor_user.id,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": vendor_user,
        "vendor_profile": vendor_profile,
    }


# ============================================================
# VENDOR LOGIN
# ============================================================

@router.post(
    "/vendor/login",
    response_model=VendorAuthResponse,
)
def vendor_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
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
            detail="Vendor account not found.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    if str(user.role).lower() != "vendor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "This account is a customer account. "
                "Please use the customer login."
            ),
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

    vendor_profile = (
        db.query(VendorProfile)
        .filter(
            VendorProfile.user_id == user.id
        )
        .first()
    )

    if not vendor_profile:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Vendor profile is missing. "
                "Please contact LUXORA support."
            ),
        )

    access_token = create_access_token(
        user_id=user.id,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "vendor_profile": vendor_profile,
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):
    return current_user


# ============================================================
# PASSWORD RESET
# ============================================================

@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
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


@router.post(
    "/verify-reset-code",
    response_model=VerifyResetCodeResponse,
)
def verify_reset_code(
    request: VerifyResetCodeRequest,
):
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


@router.post(
    "/reset-password",
    response_model=ResetPasswordResponse,
)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
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
