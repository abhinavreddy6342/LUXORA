from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Address, User
from ..schemas import AddressCreate, AddressResponse


router = APIRouter(
    prefix="/addresses",
    tags=["Addresses"],
)


# ============================================================
# GET ALL ADDRESSES
# ============================================================

@router.get(
    "",
    response_model=list[AddressResponse],
)
def get_addresses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all addresses belonging to the current user.
    """

    return (
        db.query(Address)
        .filter(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
        .all()
    )


# ============================================================
# GET DEFAULT ADDRESS
# ============================================================

@router.get(
    "/default",
    response_model=AddressResponse,
)
def get_default_address(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the current user's default address.
    """

    address = (
        db.query(Address)
        .filter(
            Address.user_id == current_user.id,
            Address.is_default.is_(True),
        )
        .first()
    )

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No default address found.",
        )

    return address


# ============================================================
# CREATE ADDRESS
# ============================================================

@router.post(
    "",
    response_model=AddressResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_address(
    address_data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new address for the current user.
    """

    # If this is the first address, automatically make it default.
    existing_count = (
        db.query(Address)
        .filter(Address.user_id == current_user.id)
        .count()
    )

    should_be_default = (
        address_data.is_default or existing_count == 0
    )

    # If this address should become default,
    # remove default status from existing addresses.
    if should_be_default:
        (
            db.query(Address)
            .filter(Address.user_id == current_user.id)
            .update(
                {
                    Address.is_default: False,
                },
                synchronize_session=False,
            )
        )

    new_address = Address(
        user_id=current_user.id,
        name=address_data.name.strip(),
        phone=address_data.phone.strip(),
        address_line=address_data.address_line.strip(),
        city=address_data.city.strip(),
        state=address_data.state.strip(),
        postal_code=address_data.postal_code.strip(),
        country=address_data.country.strip(),
        is_default=should_be_default,
    )

    db.add(new_address)
    db.commit()
    db.refresh(new_address)

    return new_address


# ============================================================
# UPDATE ADDRESS
# ============================================================

@router.put(
    "/{address_id}",
    response_model=AddressResponse,
)
def update_address(
    address_id: int,
    address_data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update an existing address belonging to the current user.
    """

    address = (
        db.query(Address)
        .filter(
            Address.id == address_id,
            Address.user_id == current_user.id,
        )
        .first()
    )

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found.",
        )

    if address_data.is_default:
        (
            db.query(Address)
            .filter(
                Address.user_id == current_user.id,
                Address.id != address_id,
            )
            .update(
                {
                    Address.is_default: False,
                },
                synchronize_session=False,
            )
        )

    address.name = address_data.name.strip()
    address.phone = address_data.phone.strip()
    address.address_line = address_data.address_line.strip()
    address.city = address_data.city.strip()
    address.state = address_data.state.strip()
    address.postal_code = address_data.postal_code.strip()
    address.country = address_data.country.strip()
    address.is_default = address_data.is_default

    db.commit()
    db.refresh(address)

    return address


# ============================================================
# SET DEFAULT ADDRESS
# ============================================================

@router.put(
    "/{address_id}/default",
    response_model=AddressResponse,
)
def set_default_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Set an existing address as the current user's default address.
    """

    address = (
        db.query(Address)
        .filter(
            Address.id == address_id,
            Address.user_id == current_user.id,
        )
        .first()
    )

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found.",
        )

    (
        db.query(Address)
        .filter(
            Address.user_id == current_user.id,
            Address.id != address_id,
        )
        .update(
            {
                Address.is_default: False,
            },
            synchronize_session=False,
        )
    )

    address.is_default = True

    db.commit()
    db.refresh(address)

    return address


# ============================================================
# DELETE ADDRESS
# ============================================================

@router.delete(
    "/{address_id}",
)
def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete an address belonging to the current user.
    """

    address = (
        db.query(Address)
        .filter(
            Address.id == address_id,
            Address.user_id == current_user.id,
        )
        .first()
    )

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found.",
        )

    was_default = address.is_default

    db.delete(address)
    db.commit()

    # If the deleted address was the default,
    # promote another address to default.
    if was_default:
        replacement = (
            db.query(Address)
            .filter(Address.user_id == current_user.id)
            .order_by(Address.created_at.desc())
            .first()
        )

        if replacement:
            replacement.is_default = True
            db.commit()

    return {
        "success": True,
        "message": "Address deleted successfully.",
    }