from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models import Hunt, Participant, Team, User
from app.schemas.participant import ParticipantCreate
from app.services.errors import ConflictError, InvalidRelationshipError, NotFoundError


def register_participant(
    database: Session,
    hunt_id: str,
    participant_data: ParticipantCreate,
) -> Participant:
    hunt = database.get(Hunt, hunt_id)
    if hunt is None:
        raise NotFoundError("Hunt not found")
    if hunt.status not in {"draft", "lobby"}:
        raise ConflictError("Participants can only join before the Hunt starts")

    team = None
    if participant_data.team_id is not None:
        team = database.get(Team, participant_data.team_id)
        if team is None or team.hunt_id != hunt_id:
            raise InvalidRelationshipError("Participant team must belong to this Hunt")
    elif participant_data.role in {"leader", "member"}:
        raise InvalidRelationshipError("Team leaders and members must be assigned to a team")

    email = participant_data.user.email
    user = database.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(name=participant_data.user.name, email=email)
        database.add(user)
        database.flush()
    else:
        user.name = participant_data.user.name

    existing = database.scalar(
        select(Participant).where(Participant.hunt_id == hunt_id, Participant.user_id == user.id)
    )
    if existing is not None:
        raise ConflictError("This user is already registered for the Hunt")

    if participant_data.role == "leader" and team is not None and team.leader_id is not None:
        raise ConflictError("This team already has a leader")

    participant = Participant(
        hunt_id=hunt_id,
        team=team,
        user=user,
        role=participant_data.role,
    )
    database.add(participant)
    if participant_data.role == "leader" and team is not None:
        team.leader = participant
    try:
        database.commit()
    except IntegrityError as error:
        database.rollback()
        raise ConflictError("Participant could not be registered because the user is already registered") from error
    return database.scalar(
        select(Participant)
        .options(joinedload(Participant.user))
        .where(Participant.id == participant.id)
    )


def list_participants(database: Session, hunt_id: str) -> list[Participant]:
    if database.get(Hunt, hunt_id) is None:
        raise NotFoundError("Hunt not found")
    return list(
        database.scalars(
            select(Participant)
            .options(joinedload(Participant.user))
            .where(Participant.hunt_id == hunt_id)
            .order_by(Participant.joined_at, Participant.id)
        ).all()
    )
