from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.routes.upload_utils import read_image_upload
from app.database import get_db
from app.schemas.submission import SubmissionRead
from app.services.image_storage import ImageValidationError, validate_image
from app.services.errors import NotFoundError
from app.services.photo_asset_service import upload_submission_photo

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("/{submission_id}/photo", response_model=SubmissionRead)
async def post_submission_photo(
    submission_id: str,
    file: UploadFile = File(...),
    database: Session = Depends(get_db),
) -> SubmissionRead:
    content = await read_image_upload(file)
    try:
        image = validate_image(content, file.filename, file.content_type)
    except ImageValidationError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    try:
        return upload_submission_photo(database, submission_id, image)
    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
