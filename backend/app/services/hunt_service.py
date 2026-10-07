import secrets
import string
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Hunt
from app.schemas.hunt import HuntCreate
from app.services.errors import ConflictError, NotFoundError

HUNT_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
HUNT_CODE_LENGTH = 5
HUNT_CODE_ATTEMPTS = 12


def generate_hunt_code() -> str:
    return "".join(secrets.choice(HUNT_CODE_ALPHABET) for _ in range(HUNT_CODE_LENGTH))


def create_hunt(database: Session, hunt_data: HuntCreate) -> Hunt:
    for _ in range(HUNT_CODE_ATTEMPTS):
        code = generate_hunt_code()
        hunt = Hunt(
            name=hunt_data.name,
            location=hunt_data.location,
            date=hunt_data.date,
            duration_minutes=hunt_data.duration_minutes,
            status="lobby",
            hunt_code=code,
        )
        database.add(hunt)
        try:
            database.commit()
            database.refresh(hunt)
            return hunt
        except IntegrityError as error:
            database.rollback()
            code_exists = database.scalar(select(Hunt.id).where(Hunt.hunt_code == code))
            if code_exists is None:
                raise ConflictError("Hunt could not be created because of a database constraint") from error
    raise ConflictError("Unable to generate a unique Hunt code; please try again")


def get_hunt(database: Session, hunt_id: str) -> Hunt:
    hunt = database.get(Hunt, hunt_id)
    if hunt is None:
        raise NotFoundError("Hunt not found")
    return hunt


def get_hunt_by_code(database: Session, hunt_code: str) -> Hunt:
    hunt = database.scalar(select(Hunt).where(Hunt.hunt_code == hunt_code.strip().upper()))
    if hunt is None:
        raise NotFoundError("Hunt not found")
    return hunt


def start_hunt(database: Session, hunt_id: str) -> Hunt:
    hunt = get_hunt(database, hunt_id)
    if hunt.status != "lobby":
        raise ConflictError("Only a Hunt in the lobby can be started")
    hunt.status = "active"
    hunt.started_at = datetime.now(timezone.utc)
    database.commit()
    database.refresh(hunt)
    return hunt


def complete_hunt(database: Session, hunt_id: str) -> Hunt:
    hunt = get_hunt(database, hunt_id)
    if hunt.status not in {"active", "submissions"}:
        raise ConflictError("Only an active Hunt can be completed")
    hunt.status = "completed"
    hunt.completed_at = datetime.now(timezone.utc)
    database.commit()
    database.refresh(hunt)
    return hunt
