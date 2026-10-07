import colorsys

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Hunt, Participant, Team
from app.schemas.team import TeamCreate
from app.services.errors import ConflictError, InvalidRelationshipError, NotFoundError

INITIAL_COLORS = ("Blue", "Red", "Green", "Yellow", "Purple", "Orange", "Cyan", "Magenta")


def _generated_color(index: int) -> str:
    hue = (index * 0.618033988749895) % 1
    red, green, blue = colorsys.hsv_to_rgb(hue, 0.72, 0.88)
    hex_color = f"#{round(red * 255):02X}{round(green * 255):02X}{round(blue * 255):02X}"
    return f"Color {index + 1} ({hex_color})"


def assign_target_color(database: Session, hunt_id: str) -> str:
    used_colors = set(
        database.scalars(select(Team.target_color).where(Team.hunt_id == hunt_id)).all()
    )
    index = 0
    while True:
        color = INITIAL_COLORS[index] if index < len(INITIAL_COLORS) else _generated_color(index)
        if color not in used_colors:
            return color
        index += 1


def create_team(database: Session, hunt_id: str, team_data: TeamCreate) -> Team:
    hunt = database.get(Hunt, hunt_id)
    if hunt is None:
        raise NotFoundError("Hunt not found")
    if hunt.status not in {"draft", "lobby"}:
        raise ConflictError("Teams can only be added before the Hunt starts")
    existing_name = database.scalar(
        select(Team.id).where(
            Team.hunt_id == hunt_id,
            func.lower(Team.name) == team_data.name.lower(),
        )
    )
    if existing_name is not None:
        raise ConflictError("A team with this name already exists in the Hunt")

    leader = None
    if team_data.leader_id:
        leader = database.get(Participant, team_data.leader_id)
        if leader is None or leader.hunt_id != hunt_id or leader.role != "leader":
            raise InvalidRelationshipError("Team leader must be a leader participant in this Hunt")
        if leader.team_id is not None:
            raise InvalidRelationshipError("Team leader is already assigned to a team")

    team = Team(
        hunt_id=hunt_id,
        name=team_data.name,
        target_color=assign_target_color(database, hunt_id),
        leader=leader,
    )
    if leader is not None:
        leader.team = team
    database.add(team)
    try:
        database.commit()
    except IntegrityError as error:
        database.rollback()
        raise ConflictError("Team could not be created because its name or color is already in use") from error
    database.refresh(team)
    return team


def list_teams(database: Session, hunt_id: str) -> list[Team]:
    if database.get(Hunt, hunt_id) is None:
        raise NotFoundError("Hunt not found")
    return list(
        database.scalars(
            select(Team).where(Team.hunt_id == hunt_id).order_by(Team.created_at, Team.id)
        ).all()
    )
