from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Hunt, Participant, Submission
from app.schemas.submission import SubmissionCreate
from app.services.errors import ConflictError, InvalidRelationshipError, NotFoundError


def create_submission(
    database: Session,
    hunt_id: str,
    submission_data: SubmissionCreate,
) -> Submission:
    hunt = database.get(Hunt, hunt_id)
    if hunt is None:
        raise NotFoundError("Hunt not found")
    if hunt.status not in {"active", "submissions"}:
        raise ConflictError("Submissions are only accepted while the Hunt is active")
    participant = database.get(Participant, submission_data.participant_id)
    if participant is None or participant.hunt_id != hunt_id or participant.team_id is None:
        raise InvalidRelationshipError("Submission participant must belong to a team in this Hunt")
    if submission_data.team_id is not None and submission_data.team_id != participant.team_id:
        raise InvalidRelationshipError("Submission team must match the participant's assigned team")

    submission = Submission(
        hunt_id=hunt_id,
        team_id=participant.team_id,
        participant_id=participant.id,
        image_reference=submission_data.image_reference,
        status="submitted",
    )
    database.add(submission)
    database.commit()
    database.refresh(submission)
    return submission


def list_submissions(database: Session, hunt_id: str) -> list[Submission]:
    if database.get(Hunt, hunt_id) is None:
        raise NotFoundError("Hunt not found")
    return list(
        database.scalars(
            select(Submission)
            .where(Submission.hunt_id == hunt_id)
            .order_by(Submission.submitted_at, Submission.id)
        ).all()
    )

