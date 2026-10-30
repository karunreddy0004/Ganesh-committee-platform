
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

import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.committee import Committee
from app.schemas.committee import (
    AuditLogRead,
    CommitteeCreate,
    CommitteeRead,
    CommitteeUpdate,
)

router = APIRouter(prefix="/committees", tags=["Committees"])


def make_slug(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "committee"


def unique_slug(db: Session, name: str, exclude_id: int | None = None) -> str:
    base_slug = make_slug(name)
    slug = base_slug
    suffix = 2

    while True:
        statement = select(Committee.id).where(Committee.slug == slug)

        if exclude_id is not None:
            statement = statement.where(Committee.id != exclude_id)

        if db.scalar(statement) is None:
            return slug

        slug = f"{base_slug}-{suffix}"
        suffix += 1


def record_change(
    db: Session,
    committee: Committee,
    action: str,
    field_name: str | None,
    old_value: object | None,
    new_value: object | None,
) -> None:
    db.add(
        AuditLog(
            committee_id=committee.id,
            committee_name=committee.name,
            action=action,
            field_name=field_name,
            old_value=None if old_value is None else str(old_value),
            new_value=None if new_value is None else str(new_value),
            actor="development-user",
        )
    )


@router.post(
    "",
    response_model=CommitteeRead,
    status_code=status.HTTP_201_CREATED,
)
def create_committee(
    payload: CommitteeCreate,
    db: Session = Depends(get_db),
):
    name = payload.name.strip()
    location = payload.location.strip()

    if len(name) < 3 or len(location) < 2:
        raise HTTPException(
            status_code=422,
            detail="Please enter a valid committee name and location.",
        )

    committee = Committee(
        name=name,
        slug=unique_slug(db, name),
        location=location,
        festival_year=payload.festival_year,
        status="draft",
    )

    try:
        db.add(committee)
        db.flush()

        for field_name in (
            "name",
            "slug",
            "location",
            "festival_year",
            "status",
        ):
            record_change(
                db,
                committee,
                "CREATE",
                field_name,
                None,
                getattr(committee, field_name),
            )

        db.commit()
        db.refresh(committee)
        return committee
    except Exception:
        db.rollback()
        raise


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


@router.patch("/{committee_id}", response_model=CommitteeRead)
def update_committee(
    committee_id: int,
    payload: CommitteeUpdate,
    db: Session = Depends(get_db),
):
    committee = db.get(Committee, committee_id)

    if committee is None:
        raise HTTPException(status_code=404, detail="Committee not found")

    updates = payload.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=422,
            detail="Provide at least one field to update.",
        )

    if any(value is None for value in updates.values()):
        raise HTTPException(
            status_code=422,
            detail="Updated fields cannot be null.",
        )

    if "name" in updates:
        updates["name"] = updates["name"].strip()
        if len(updates["name"]) < 3:
            raise HTTPException(
                status_code=422,
                detail="Committee name must contain at least 3 characters.",
            )

    if "location" in updates:
        updates["location"] = updates["location"].strip()
        if len(updates["location"]) < 2:
            raise HTTPException(
                status_code=422,
                detail="Location must contain at least 2 characters.",
            )

    if "status" in updates:
        updates["status"] = updates["status"].strip()
        if not updates["status"]:
            raise HTTPException(
                status_code=422,
                detail="Status cannot be empty.",
            )

    changes: list[tuple[str, object, object]] = []

    for field_name, new_value in updates.items():
        old_value = getattr(committee, field_name)

        if old_value != new_value:
            changes.append((field_name, old_value, new_value))

    if "name" in updates:
        new_name = updates["name"]
        if committee.name != new_name:
            new_slug = unique_slug(db, new_name, exclude_id=committee.id)
            if committee.slug != new_slug:
                changes.append(("slug", committee.slug, new_slug))

    if not changes:
        return committee

    try:
        for field_name, _old_value, new_value in changes:
            setattr(committee, field_name, new_value)

        for field_name, old_value, new_value in changes:
            record_change(
                db,
                committee,
                "UPDATE",
                field_name,
                old_value,
                new_value,
            )

        db.commit()
        db.refresh(committee)
        return committee
    except Exception:
        db.rollback()
        raise


@router.delete("/{committee_id}")
def delete_committee(
    committee_id: int,
    db: Session = Depends(get_db),
):
    committee = db.get(Committee, committee_id)

    if committee is None:
        raise HTTPException(status_code=404, detail="Committee not found")

    committee_id_snapshot = committee.id
    committee_name_snapshot = committee.name

    try:
        for field_name in (
            "name",
            "slug",
            "location",
            "festival_year",
            "status",
        ):
            record_change(
                db,
                committee,
                "DELETE",
                field_name,
                getattr(committee, field_name),
                None,
            )

        db.delete(committee)
        db.commit()

        return {
            "message": "Committee deleted. Audit history has been preserved.",
            "committee_id": committee_id_snapshot,
            "committee_name": committee_name_snapshot,
        }
    except Exception:
        db.rollback()
        raise


@router.get(
    "/{committee_id}/audit",
    response_model=list[AuditLogRead],
)
def get_committee_audit(
    committee_id: int,
    db: Session = Depends(get_db),
):
    statement = (
        select(AuditLog)
        .where(AuditLog.committee_id == committee_id)
        .order_by(AuditLog.changed_at.desc(), AuditLog.id.desc())
    )
    return db.scalars(statement).all()
