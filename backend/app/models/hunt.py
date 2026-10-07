from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Date, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Hunt(Base):
    __tablename__ = "hunts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    location: Mapped[str] = mapped_column(String(240), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="lobby")
    hunt_code: Mapped[str] = mapped_column(String(6), unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    teams: Mapped[list["Team"]] = relationship(back_populates="hunt", cascade="all, delete-orphan")
    participants: Mapped[list["Participant"]] = relationship(back_populates="hunt", cascade="all, delete-orphan")
    submissions: Mapped[list["Submission"]] = relationship(back_populates="hunt", cascade="all, delete-orphan")
    scores: Mapped[list["Score"]] = relationship(back_populates="hunt", cascade="all, delete-orphan")
    rewards: Mapped[list["Reward"]] = relationship(back_populates="hunt", cascade="all, delete-orphan")
    certificates: Mapped[list["Certificate"]] = relationship(back_populates="hunt", cascade="all, delete-orphan")
