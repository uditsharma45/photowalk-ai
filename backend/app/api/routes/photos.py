from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.routes.upload_utils import read_image_upload
from app.database import get_db
from app.models import PhotoAsset
from app.schemas.photo_asset import PhotoAssetRead
from app.services.image_storage import ImageValidationError, validate_image
from app.services.photo_asset_service import create_photo_asset, get_photo_asset
from app.services.errors import NotFoundError

router = APIRouter(prefix="/photos", tags=["photos"])


@router.post("", response_model=PhotoAssetRead, status_code=status.HTTP_201_CREATED)
async def post_photo(
    file: UploadFile = File(...),
    database: Session = Depends(get_db),
) -> PhotoAsset:
    content = await read_image_upload(file)
    try:
        image = validate_image(content, file.filename, file.content_type)
    except ImageValidationError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    return create_photo_asset(database, image, str(uuid4()))


@router.get("/{photo_id}", response_model=PhotoAssetRead)
def get_photo(photo_id: str, database: Session = Depends(get_db)) -> PhotoAsset:
    try:
        return get_photo_asset(database, photo_id)
    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
