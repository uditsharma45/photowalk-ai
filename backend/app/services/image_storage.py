import os
import tempfile
import warnings
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

from PIL import Image, UnidentifiedImageError

DEFAULT_UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads"
MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "10"))
if MAX_IMAGE_SIZE_MB <= 0:
    raise ValueError("MAX_IMAGE_SIZE_MB must be greater than zero")
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

FORMAT_DETAILS = {
    "JPEG": ("image/jpeg", ".jpg", {".jpg", ".jpeg"}),
    "PNG": ("image/png", ".png", {".png"}),
    "WEBP": ("image/webp", ".webp", {".webp"}),
}


class ImageValidationError(ValueError):
    pass


@dataclass(frozen=True)
class ValidatedImage:
    content: bytes
    mime_type: str
    extension: str
    file_size: int


def upload_root() -> Path:
    configured_path = os.getenv("UPLOAD_DIR")
    return Path(configured_path).expanduser().resolve() if configured_path else DEFAULT_UPLOAD_ROOT


def validate_image(content: bytes, filename: str | None, content_type: str | None) -> ValidatedImage:
    file_size = len(content)
    if file_size > MAX_IMAGE_SIZE_BYTES:
        raise ImageValidationError(f"Image must be smaller than {MAX_IMAGE_SIZE_MB} MB.")
    if not content:
        raise ImageValidationError("The selected image is empty.")

    extension = Path(filename or "").suffix.lower()
    mime_type = (content_type or "").split(";", 1)[0].strip().lower()
    supported_details = next(
        (
            (detected_mime, detected_extension)
            for detected_mime, detected_extension, extensions in FORMAT_DETAILS.values()
            if extension in extensions and mime_type == detected_mime
        ),
        None,
    )
    if supported_details is None:
        raise ImageValidationError("Unsupported image format. Choose a JPEG, PNG, or WebP image.")

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            image = Image.open(BytesIO(content))
            detected_format = image.format
            image.verify()
    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ) as error:
        raise ImageValidationError("The selected file is not a valid image.") from error

    detected_details = FORMAT_DETAILS.get(detected_format or "")
    if detected_details is None or detected_details[0] != mime_type:
        raise ImageValidationError("The image content does not match its file type.")

    return ValidatedImage(
        content=content,
        mime_type=mime_type,
        extension=supported_details[1],
        file_size=file_size,
    )


def store_image(image: ValidatedImage, relative_directory: str, file_stem: str) -> str:
    destination_directory = upload_root() / relative_directory
    destination_directory.mkdir(parents=True, exist_ok=True)
    image_path = destination_directory / f"{file_stem}{image.extension}"
    with tempfile.NamedTemporaryFile(dir=destination_directory, delete=False) as temporary_file:
        temporary_path = Path(temporary_file.name)
        temporary_file.write(image.content)
    try:
        os.replace(temporary_path, image_path)
    finally:
        temporary_path.unlink(missing_ok=True)
    return image_path.relative_to(upload_root()).as_posix()


def image_url(image_path: str) -> str:
    return f"/uploads/{image_path}"
