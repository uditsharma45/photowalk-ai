from uuid import uuid4

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Reward(Base):
    __tablename__ = "rewards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    hunt_id: Mapped[str] = mapped_column(ForeignKey("hunts.id", ondelete="CASCADE"), nullable=False, index=True)
    placement: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)

    hunt: Mapped["Hunt"] = relationship(back_populates="rewards")
