from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.team import TeamCreate, TeamRead
from app.services.team_service import create_team, list_teams

router = APIRouter(prefix="/hunts/{hunt_id}/teams", tags=["teams"])


@router.post("", response_model=TeamRead, status_code=status.HTTP_201_CREATED)
def post_team(
    hunt_id: str,
    team_data: TeamCreate,
    database: Session = Depends(get_db),
) -> TeamRead:
    return create_team(database, hunt_id, team_data)


@router.get("", response_model=list[TeamRead])
def get_teams(hunt_id: str, database: Session = Depends(get_db)) -> list[TeamRead]:
    return list_teams(database, hunt_id)
