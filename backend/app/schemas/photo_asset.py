from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PhotoAssetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    image_path: str
    image_url: str
    mime_type: str
    file_size: int
    uploaded_at: datetime
