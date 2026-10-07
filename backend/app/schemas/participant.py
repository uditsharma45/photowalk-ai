from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.user import UserCreate, UserRead


ParticipantRole = Literal["organizer", "leader", "member"]


class ParticipantCreate(BaseModel):
    user: UserCreate
    role: ParticipantRole = "member"
    team_id: str | None = None

    @field_validator("team_id")
    @classmethod
    def reject_blank_team_id(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Team ID cannot be blank")
        return value.strip() if value else value


class ParticipantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    hunt_id: str
    team_id: str | None
    user_id: str
    user: UserRead
    role: ParticipantRole
    joined_at: datetime
