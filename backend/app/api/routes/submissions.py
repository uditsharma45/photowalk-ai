from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.routes.upload_utils import read_image_upload
from app.database import get_db
from app.schemas.submission import SubmissionCreate, SubmissionRead
from app.services.errors import ConflictError, InvalidRelationshipError, NotFoundError
from app.services.image_storage import ImageValidationError, validate_image
from app.services.submission_service import create_uploaded_submission
from app.services.submission_service import create_submission, list_submissions

router = APIRouter(prefix="/hunts/{hunt_id}/submissions", tags=["submissions"])


@router.post("", response_model=SubmissionRead, status_code=status.HTTP_201_CREATED)
def post_submission(
    hunt_id: str,
    submission_data: SubmissionCreate,
    database: Session = Depends(get_db),
) -> SubmissionRead:
    return create_submission(database, hunt_id, submission_data)


@router.post("/upload", response_model=SubmissionRead, status_code=status.HTTP_201_CREATED)
async def post_submission_with_photo(
    hunt_id: str,
    participant_id: str = Form(...),
    team_id: str | None = Form(default=None),
    file: UploadFile = File(...),
    database: Session = Depends(get_db),
) -> SubmissionRead:
    content = await read_image_upload(file)
    try:
        image = validate_image(content, file.filename, file.content_type)
    except ImageValidationError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    submission_data = SubmissionCreate(
        participant_id=participant_id,
        team_id=team_id,
        image_reference="upload-pending",
    )
    try:
        return create_uploaded_submission(database, hunt_id, submission_data, image)
    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except InvalidRelationshipError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(error)) from error


@router.get("", response_model=list[SubmissionRead])
def get_submissions(
    hunt_id: str,
    database: Session = Depends(get_db),
) -> list[SubmissionRead]:
    return list_submissions(database, hunt_id)
