
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CommitteeCreate(BaseModel):
    name: str = Field(min_length=3, max_length=150)
    location: str = Field(min_length=2, max_length=250)
    festival_year: int = Field(ge=2020, le=2100)


class CommitteeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=150)
    location: str | None = Field(default=None, min_length=2, max_length=250)
    festival_year: int | None = Field(default=None, ge=2020, le=2100)
    status: str | None = Field(default=None, min_length=1, max_length=30)


class CommitteeRead(BaseModel):
    id: int
    name: str
    slug: str
    location: str
    festival_year: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogRead(BaseModel):
    id: int
    committee_id: int
    committee_name: str
    action: str
    field_name: str | None
    old_value: str | None
    new_value: str | None
    actor: str
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)
