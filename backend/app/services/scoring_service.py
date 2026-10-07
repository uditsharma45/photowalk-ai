from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Hunt, Score, Team
from app.schemas.submission import TeamStanding
from app.services.errors import NotFoundError


def get_team_standings(database: Session, hunt_id: str) -> list[TeamStanding]:
    if database.get(Hunt, hunt_id) is None:
        raise NotFoundError("Hunt not found")

    teams = database.scalars(
        select(Team)
        .options(selectinload(Team.submissions))
        .where(Team.hunt_id == hunt_id)
    ).all()
    score_rows = database.execute(
        select(Score.team_id, Score.score).where(Score.hunt_id == hunt_id)
    ).all()
    scores_by_team: dict[str, list[float]] = {}
    for team_id, score in score_rows:
        scores_by_team.setdefault(team_id, []).append(score)

    standings = [
        {
            "team": team,
            "average_score": (
                sum(scores_by_team[team.id]) / len(scores_by_team[team.id])
                if scores_by_team.get(team.id)
                else 0.0
            ),
            "submission_count": len(team.submissions),
        }
        for team in teams
    ]
    standings.sort(
        key=lambda row: (
            -row["average_score"],
            -row["submission_count"],
            row["team"].name.casefold(),
        )
    )
    return [
        TeamStanding(
            rank=rank,
            team_id=row["team"].id,
            team_name=row["team"].name,
            target_color=row["team"].target_color,
            average_score=round(row["average_score"], 2),
            submission_count=row["submission_count"],
        )
        for rank, row in enumerate(standings, start=1)
    ]
