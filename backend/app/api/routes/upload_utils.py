from fastapi import HTTPException, UploadFile, status

from app.services.image_storage import MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_MB


async def read_image_upload(upload: UploadFile) -> bytes:
    content = bytearray()
    while chunk := await upload.read(1024 * 1024):
        if len(content) + len(chunk) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"Image must be smaller than {MAX_IMAGE_SIZE_MB} MB.",
            )
        content.extend(chunk)
    return bytes(content)
