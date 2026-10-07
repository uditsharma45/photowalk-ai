from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    leader_id: str | None = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Team name cannot be blank")
        return value


class TeamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    hunt_id: str
    name: str
    target_color: str
    leader_id: str | None
    created_at: datetime
