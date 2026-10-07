from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Certificate(Base):
    __tablename__ = "certificates"
    __table_args__ = (UniqueConstraint("hunt_id", "certificate_id", name="uq_certificate_hunt_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    hunt_id: Mapped[str] = mapped_column(ForeignKey("hunts.id", ondelete="CASCADE"), nullable=False, index=True)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id", ondelete="CASCADE"), nullable=False)
    certificate_type: Mapped[str] = mapped_column(String(40), nullable=False)
    certificate_id: Mapped[str] = mapped_column(String(120), nullable=False)
    achievement_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    hunt: Mapped["Hunt"] = relationship(back_populates="certificates")
    participant: Mapped["Participant"] = relationship(back_populates="certificates")
