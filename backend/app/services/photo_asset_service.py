from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models import PhotoAsset, Submission
from app.services.errors import NotFoundError
from app.services.image_storage import ValidatedImage, image_url, store_image, upload_root


def create_photo_asset(database: Session, image: ValidatedImage, photo_id: str) -> PhotoAsset:
    image_path = store_image(image, "photowalk", photo_id)
    asset = PhotoAsset(
        id=photo_id,
        image_path=image_path,
        image_url=image_url(image_path),
        mime_type=image.mime_type,
        file_size=image.file_size,
    )
    database.add(asset)
    try:
        database.commit()
    except Exception:
        database.rollback()
        (upload_root() / image_path).unlink(missing_ok=True)
        raise
    database.refresh(asset)
    return asset


def get_photo_asset(database: Session, photo_id: str) -> PhotoAsset:
    asset = database.get(PhotoAsset, photo_id)
    if asset is None:
        raise NotFoundError("Photo not found")
    return asset


def upload_submission_photo(
    database: Session,
    submission_id: str,
    image: ValidatedImage,
) -> Submission:
    submission = database.get(Submission, submission_id)
    if submission is None:
        raise NotFoundError("Submission not found")

    safe_hunt_id = str(UUID(submission.hunt_id))
    safe_submission_id = str(UUID(submission.id))
    previous_image_path = submission.image_path
    relative_directory = f"hunts/{safe_hunt_id}"
    image_path = store_image(image, relative_directory, f"{safe_submission_id}-{uuid4()}")
    public_url = image_url(image_path)

    submission.image_reference = public_url
    submission.image_path = image_path
    submission.image_url = public_url
    submission.mime_type = image.mime_type
    submission.file_size = image.file_size
    submission.uploaded_at = datetime.now(timezone.utc)
    try:
        database.commit()
    except Exception:
        database.rollback()
        (upload_root() / image_path).unlink(missing_ok=True)
        raise
    database.refresh(submission)
    if previous_image_path and previous_image_path != image_path:
        storage_root = upload_root().resolve()
        previous_path = (storage_root / previous_image_path).resolve()
        if previous_path.is_relative_to(storage_root):
            previous_path.unlink(missing_ok=True)
    return submission
