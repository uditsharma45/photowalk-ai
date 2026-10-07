from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.participant import ParticipantCreate, ParticipantRead
from app.services.participant_service import list_participants, register_participant

router = APIRouter(prefix="/hunts/{hunt_id}/participants", tags=["participants"])


@router.post("", response_model=ParticipantRead, status_code=status.HTTP_201_CREATED)
def post_participant(
    hunt_id: str,
    participant_data: ParticipantCreate,
    database: Session = Depends(get_db),
) -> ParticipantRead:
    return register_participant(database, hunt_id, participant_data)


@router.get("", response_model=list[ParticipantRead])
def get_participants(
    hunt_id: str,
    database: Session = Depends(get_db),
) -> list[ParticipantRead]:
    return list_participants(database, hunt_id)
