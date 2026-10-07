from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.hunt import HuntCreate, HuntRead
from app.schemas.submission import TeamStanding
from app.services.hunt_service import complete_hunt, create_hunt, get_hunt, get_hunt_by_code, start_hunt
from app.services.scoring_service import get_team_standings

router = APIRouter(prefix="/hunts", tags=["hunts"])


@router.post("", response_model=HuntRead, status_code=status.HTTP_201_CREATED)
def post_hunt(hunt_data: HuntCreate, database: Session = Depends(get_db)) -> HuntRead:
    return create_hunt(database, hunt_data)


@router.get("/code/{hunt_code}", response_model=HuntRead)
def get_hunt_from_code(hunt_code: str, database: Session = Depends(get_db)) -> HuntRead:
    return get_hunt_by_code(database, hunt_code)


@router.get("/{hunt_id}", response_model=HuntRead)
def get_hunt_by_id(hunt_id: str, database: Session = Depends(get_db)) -> HuntRead:
    return get_hunt(database, hunt_id)


@router.post("/{hunt_id}/start", response_model=HuntRead)
def post_start_hunt(hunt_id: str, database: Session = Depends(get_db)) -> HuntRead:
    return start_hunt(database, hunt_id)


@router.post("/{hunt_id}/complete", response_model=HuntRead)
def post_complete_hunt(hunt_id: str, database: Session = Depends(get_db)) -> HuntRead:
    return complete_hunt(database, hunt_id)


@router.get("/{hunt_id}/leaderboard", response_model=list[TeamStanding])
def get_hunt_leaderboard(hunt_id: str, database: Session = Depends(get_db)) -> list[TeamStanding]:
    return get_team_standings(database, hunt_id)
