from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Team(Base):
    __tablename__ = "teams"
    __table_args__ = (
        UniqueConstraint("hunt_id", "name", name="uq_team_hunt_name"),
        UniqueConstraint("hunt_id", "target_color", name="uq_team_hunt_target_color"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    hunt_id: Mapped[str] = mapped_column(ForeignKey("hunts.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    target_color: Mapped[str] = mapped_column(String(40), nullable=False)
    leader_id: Mapped[str | None] = mapped_column(ForeignKey("participants.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    hunt: Mapped["Hunt"] = relationship(back_populates="teams")
    participants: Mapped[list["Participant"]] = relationship(
        back_populates="team",
        foreign_keys="Participant.team_id",
    )
    leader: Mapped["Participant | None"] = relationship(
        foreign_keys=[leader_id],
        post_update=True,
    )
    submissions: Mapped[list["Submission"]] = relationship(back_populates="team")
    scores: Mapped[list["Score"]] = relationship(back_populates="team")
