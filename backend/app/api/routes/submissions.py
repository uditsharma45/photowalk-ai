from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.submission import SubmissionCreate, SubmissionRead
from app.services.submission_service import create_submission, list_submissions

router = APIRouter(prefix="/hunts/{hunt_id}/submissions", tags=["submissions"])


@router.post("", response_model=SubmissionRead, status_code=status.HTTP_201_CREATED)
def post_submission(
    hunt_id: str,
    submission_data: SubmissionCreate,
    database: Session = Depends(get_db),
) -> SubmissionRead:
    return create_submission(database, hunt_id, submission_data)


@router.get("", response_model=list[SubmissionRead])
def get_submissions(
    hunt_id: str,
    database: Session = Depends(get_db),
) -> list[SubmissionRead]:
    return list_submissions(database, hunt_id)
