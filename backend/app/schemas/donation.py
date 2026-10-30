
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


PaymentMethod = Literal[
    "Cash", "UPI", "Bank Transfer", "Card", "Cheque", "Other"
]


class DonationCreate(BaseModel):
    committee_id: int = Field(gt=0)
    donor_name: str = Field(min_length=2, max_length=150)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    donation_date: date
    payment_method: PaymentMethod
    reference_number: str | None = Field(default=None, max_length=100)
    notes: str | None = Field(default=None, max_length=500)


class DonationUpdate(BaseModel):
    donor_name: str | None = Field(default=None, min_length=2, max_length=150)
    amount: Decimal | None = Field(
        default=None, gt=0, max_digits=12, decimal_places=2
    )
    donation_date: date | None = None
    payment_method: PaymentMethod | None = None
    reference_number: str | None = Field(default=None, max_length=100)
    notes: str | None = Field(default=None, max_length=500)


class DonationRead(BaseModel):
    id: int
    committee_id: int
    donor_name: str
    amount: Decimal
    donation_date: date
    payment_method: str
    reference_number: str | None
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
