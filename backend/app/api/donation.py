
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Committee, Donation
from app.schemas.donation import (
    DonationCreate,
    DonationRead,
    DonationUpdate,
)

router = APIRouter(prefix="/donations", tags=["Donations"])


@router.post(
    "",
    response_model=DonationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_donation(
    data: DonationCreate,
    db: Session = Depends(get_db),
):
    committee = db.get(Committee, data.committee_id)
    if committee is None:
        raise HTTPException(
            status_code=404,
            detail="Committee not found",
        )

    donation = Donation(**data.model_dump())
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation


@router.get("", response_model=list[DonationRead])
def list_donations(
    committee_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Donation)

    if committee_id is not None:
        query = query.filter(Donation.committee_id == committee_id)

    return query.order_by(Donation.donation_date.desc()).all()


@router.get("/{donation_id}", response_model=DonationRead)
def get_donation(
    donation_id: int,
    db: Session = Depends(get_db),
):
    donation = db.get(Donation, donation_id)

    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found")

    return donation


@router.patch("/{donation_id}", response_model=DonationRead)
def update_donation(
    donation_id: int,
    data: DonationUpdate,
    db: Session = Depends(get_db),
):
    donation = db.get(Donation, donation_id)

    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(donation, field, value)

    db.commit()
    db.refresh(donation)
    return donation


@router.delete("/{donation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_donation(
    donation_id: int,
    db: Session = Depends(get_db),
):
    donation = db.get(Donation, donation_id)

    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found")

    db.delete(donation)
    db.commit()
    return None


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Committee, Donation
from app.schemas.donation import (
    DonationCreate,
    DonationRead,
    DonationUpdate,
)

router = APIRouter(prefix="/donations", tags=["Donations"])


@router.post(
    "",
    response_model=DonationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_donation(
    data: DonationCreate,
    db: Session = Depends(get_db),
):
    committee = db.get(Committee, data.committee_id)

    if committee is None:
        raise HTTPException(status_code=404, detail="Committee not found")

    donation = Donation(**data.model_dump())
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation


@router.get("", response_model=list[DonationRead])
def list_donations(
    committee_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Donation)

    if committee_id is not None:
        query = query.filter(Donation.committee_id == committee_id)

    return query.order_by(Donation.donation_date.desc()).all()


@router.get("/{donation_id}", response_model=DonationRead)
def get_donation(
    donation_id: int,
    db: Session = Depends(get_db),
):
    donation = db.get(Donation, donation_id)

    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found")

    return donation


@router.patch("/{donation_id}", response_model=DonationRead)
def update_donation(
    donation_id: int,
    data: DonationUpdate,
    db: Session = Depends(get_db),
):
    donation = db.get(Donation, donation_id)

    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(donation, field, value)

    db.commit()
    db.refresh(donation)
    return donation


@router.delete("/{donation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_donation(
    donation_id: int,
    db: Session = Depends(get_db),
):
    donation = db.get(Donation, donation_id)

    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found")

    db.delete(donation)
    db.commit()
    return None
