
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Committee(Base):
    __tablename__ = "committees"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    name: Mapped[str] = mapped_column(
        String(150), nullable=False
    )
    slug: Mapped[str] = mapped_column(
        String(180), unique=True, index=True, nullable=False
    )
    location: Mapped[str] = mapped_column(
        String(250), nullable=False
    )
    festival_year: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(30), default="draft", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
