from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


HuntStatus = Literal["draft", "lobby", "active", "submissions", "completed"]


class HuntCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    location: str = Field(min_length=1, max_length=240)
    date: date
    duration_minutes: int = Field(gt=0)

    @field_validator("name", "location")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value


class HuntRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    location: str
    date: date
    duration_minutes: int
    status: HuntStatus
    hunt_code: str
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
