"""
Juryline — Cloudflare R2 Client
Uses boto3 with S3-compatible API for Cloudflare R2.
Generates presigned URLs for direct frontend uploads.
"""

import boto3
from botocore.config import Config
from app.config import get_settings


def get_r2_client():
    """Get boto3 S3 client configured for Cloudflare R2."""
    settings = get_settings()

    if not settings.r2_account_id:
        return None  # R2 not configured yet

    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        config=Config(
            signature_version="s3v4",
            region_name="auto",
        ),
    )


def generate_presigned_upload_url(
    file_key: str,
    content_type: str,
    expires_in: int = 3600,
) -> str | None:
    """Generate a presigned PUT URL for direct upload to R2."""
    client = get_r2_client()
    if not client:
        return None

    settings = get_settings()
    return client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.r2_bucket_name,
            "Key": file_key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )


def get_public_url(file_key: str) -> str:
    """Get the public URL for a file stored in R2."""
    settings = get_settings()
    return f"{settings.r2_public_url}/{file_key}"
