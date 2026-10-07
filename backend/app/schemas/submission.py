from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SubmissionCreate(BaseModel):
    participant_id: str
    image_reference: str = Field(min_length=1, max_length=2048)
    team_id: str | None = None

    @field_validator("image_reference")
    @classmethod
    def strip_image_reference(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Image reference cannot be blank")
        return value


class SubmissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    hunt_id: str
    team_id: str
    participant_id: str
    image_reference: str
    submitted_at: datetime
    status: Literal["submitted"]


class TeamStanding(BaseModel):
    rank: int
    team_id: str
    team_name: str
    target_color: str
    average_score: float
    submission_count: int
