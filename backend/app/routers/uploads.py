"""
Juryline -- Upload Router
Generates presigned URLs for direct frontend uploads to Cloudflare R2.
"""

from uuid import uuid4
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel

from app.config import get_settings
from app.r2_client import generate_presigned_upload_url, get_r2_client
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


@router.post("/proxy")
async def proxy_upload(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Upload file to R2 via backend proxy (avoids CORS issues)."""
    settings = get_settings()
    client = get_r2_client()

    if not client:
        raise HTTPException(status_code=503, detail="File storage not configured")

    # validate file size (e.g., 5MB limit)
    # This is a basic check; Nginx/Uvicorn limits might apply first
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 100MB)")

    file_key = f"uploads/{user['id']}/{uuid4()}_{file.filename}"

    try:
        client.upload_fileobj(
            file.file,
            settings.r2_bucket_name,
            file_key,
            ExtraArgs={"ContentType": file.content_type},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    return {
        "file_key": file_key,
        "public_url": f"{settings.r2_public_url}/{file_key}",
    }
