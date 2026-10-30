
import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.committee import Committee
from app.schemas.committee import CommitteeCreate, CommitteeRead

router = APIRouter(prefix="/committees", tags=["Committees"])


def make_slug(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "committee"


@router.post(
    "",
    response_model=CommitteeRead,
    status_code=status.HTTP_201_CREATED,
)
def create_committee(
    payload: CommitteeCreate,
    db: Session = Depends(get_db),
):
    base_slug = make_slug(payload.name)
    slug = base_slug
    suffix = 2

    while db.scalar(
        select(Committee.id).where(Committee.slug == slug)
    ) is not None:
        slug = f"{base_slug}-{suffix}"
        suffix += 1

    committee = Committee(
        name=payload.name.strip(),
        slug=slug,
        location=payload.location.strip(),
        festival_year=payload.festival_year,
        status="draft",
    )

    db.add(committee)
    db.commit()
    db.refresh(committee)
    return committee


@router.get("", response_model=list[CommitteeRead])
def list_committees(
    db: Session = Depends(get_db),
):
    statement = select(Committee).order_by(Committee.id.desc())
    return db.scalars(statement).all()


@router.get("/{committee_id}", response_model=CommitteeRead)
def get_committee(
    committee_id: int,
    db: Session = Depends(get_db),
):
    committee = db.get(Committee, committee_id)

    if committee is None:
        raise HTTPException(
            status_code=404,
            detail="Committee not found",
        )

    return committee
