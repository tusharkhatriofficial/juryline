import sys
import os
import boto3
from botocore.config import Config

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

from app.config import get_settings

def fix_cors():
    print("--- Applying CORS Policy to R2 Bucket ---")
    settings = get_settings()

    if not settings.r2_account_id or not settings.r2_access_key_id:
        print("❌ Error: Missing R2 credentials.")
        return

    print(f"Target Bucket: {settings.r2_bucket_name}")

    client = boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        config=Config(
            signature_version="s3v4",
            region_name="auto",
        ),
    )

    cors_configuration = {
        'CORSRules': [{
            'AllowedHeaders': ['*'],
            'AllowedMethods': ['PUT', 'POST', 'GET', 'HEAD', 'DELETE'],
            'AllowedOrigins': ['*'],  # Allow all origins for dev/prod compatibility
            'ExposeHeaders': ['ETag'],
            'MaxAgeSeconds': 3000
        }]
    }

    try:
        client.put_bucket_cors(
            Bucket=settings.r2_bucket_name,
            CORSConfiguration=cors_configuration
        )
        print("✅ Success! CORS policy applied.")
        print("Required Origins: * (Permissive for development)")
        print("Allowed Methods: PUT, POST, GET, HEAD, DELETE")
    except Exception as e:
        print(f"❌ Failed to apply CORS policy: {e}")

if __name__ == "__main__":
    fix_cors()
