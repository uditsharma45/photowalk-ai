from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    hunt_id: Mapped[str] = mapped_column(ForeignKey("hunts.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True)
    image_reference: Mapped[str] = mapped_column(String(2048), nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="submitted")

    hunt: Mapped["Hunt"] = relationship(back_populates="submissions")
    team: Mapped["Team"] = relationship(back_populates="submissions")
    participant: Mapped["Participant"] = relationship(back_populates="submissions")
    score: Mapped["Score | None"] = relationship(back_populates="submission", uselist=False)
