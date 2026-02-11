"""
Juryline -- Upload Router
Generates presigned URLs for direct frontend uploads to Cloudflare R2.
"""

from uuid import uuid4
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.config import get_settings
from app.r2_client import generate_presigned_upload_url
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/uploads", tags=["uploads"])


class PresignRequest(BaseModel):
    filename: str
    content_type: str


class PresignResponse(BaseModel):
    upload_url: str
    file_key: str
    public_url: str


@router.post("/presign", response_model=PresignResponse)
async def get_presigned_url(
    body: PresignRequest,
    user: dict = Depends(get_current_user),
):
    """Generate a presigned PUT URL for direct upload to R2."""
    settings = get_settings()

    file_key = f"uploads/{user['id']}/{uuid4()}_{body.filename}"

    upload_url = generate_presigned_upload_url(
        file_key=file_key,
        content_type=body.content_type,
    )

    if not upload_url:
        raise HTTPException(
            status_code=503,
            detail="File storage is not configured",
        )

    return PresignResponse(
        upload_url=upload_url,
        file_key=file_key,
        public_url=f"{settings.r2_public_url}/{file_key}",
    )
