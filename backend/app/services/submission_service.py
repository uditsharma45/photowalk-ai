from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Hunt, Participant, Submission
from app.schemas.submission import SubmissionCreate
from app.services.errors import ConflictError, InvalidRelationshipError, NotFoundError
from app.services.image_storage import ValidatedImage, image_url, store_image, upload_root


def create_submission(
    database: Session,
    hunt_id: str,
    submission_data: SubmissionCreate,
) -> Submission:
    submission = build_submission(database, hunt_id, submission_data, submission_data.image_reference)
    database.add(submission)
    database.commit()
    database.refresh(submission)
    return submission


def create_uploaded_submission(
    database: Session,
    hunt_id: str,
    submission_data: SubmissionCreate,
    image: ValidatedImage,
) -> Submission:
    submission_id = str(uuid4())
    hunt = database.get(Hunt, hunt_id)
    if hunt is None:
        raise NotFoundError("Hunt not found")
    safe_hunt_id = str(UUID(hunt.id))
    submission = build_submission(
        database,
        hunt_id,
        submission_data,
        f"upload-pending://{submission_id}",
        submission_id=submission_id,
    )
    relative_directory = f"hunts/{safe_hunt_id}"
    image_path = store_image(image, relative_directory, submission_id)
    public_url = image_url(image_path)
    submission.image_reference = public_url
    submission.image_path = image_path
    submission.image_url = public_url
    submission.mime_type = image.mime_type
    submission.file_size = image.file_size
    submission.uploaded_at = datetime.now(timezone.utc)
    database.add(submission)
    try:
        database.commit()
    except Exception:
        database.rollback()
        (upload_root() / image_path).unlink(missing_ok=True)
        raise
    database.refresh(submission)
    return submission


def build_submission(
    database: Session,
    hunt_id: str,
    submission_data: SubmissionCreate,
    image_reference: str,
    submission_id: str | None = None,
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

    return Submission(
        id=submission_id or str(uuid4()),
        hunt_id=hunt_id,
        team_id=participant.team_id,
        participant_id=participant.id,
        image_reference=image_reference,
        status="submitted",
    )


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
