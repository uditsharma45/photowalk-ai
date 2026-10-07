from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Participant(Base):
    __tablename__ = "participants"
    __table_args__ = (UniqueConstraint("hunt_id", "user_id", name="uq_participant_hunt_user"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    hunt_id: Mapped[str] = mapped_column(ForeignKey("hunts.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id: Mapped[str | None] = mapped_column(ForeignKey("teams.id", ondelete="SET NULL"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="member")
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    hunt: Mapped["Hunt"] = relationship(back_populates="participants")
    team: Mapped["Team | None"] = relationship(back_populates="participants", foreign_keys=[team_id])
    user: Mapped["User"] = relationship(back_populates="participants")
    submissions: Mapped[list["Submission"]] = relationship(back_populates="participant")
    scores: Mapped[list["Score"]] = relationship(back_populates="participant")
    certificates: Mapped[list["Certificate"]] = relationship(back_populates="participant")
