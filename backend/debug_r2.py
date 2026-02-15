import sys
import os
import urllib.request
import urllib.error

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

from app.config import get_settings
from app.r2_client import generate_presigned_upload_url

def test_r2():
    print("--- Debugging R2 Configuration ---")
    settings = get_settings()
    
    print(f"R2 Account ID: {'[SET]' if settings.r2_account_id else '[MISSING]'}")
    print(f"R2 Access Key: {'[SET]' if settings.r2_access_key_id else '[MISSING]'}")
    print(f"R2 Secret Key: {'[SET]' if settings.r2_secret_access_key else '[MISSING]'}")
    print(f"R2 Bucket: {settings.r2_bucket_name}")
    print(f"R2 Public URL: {settings.r2_public_url}")

    if not settings.r2_account_id or not settings.r2_access_key_id:
        print("\n❌ Error: Missing R2 credentials in environment variables.")
        return

    print("\nAttempting to generate presigned URL...")
    try:
        url = generate_presigned_upload_url("debug_test.txt", "text/plain")
        if url:
            print(f"✅ Success! Presigned URL generated.")
            print(f"URL: {url[:50]}...")
            
            # Try uploading
            print("\nAttempting validation upload (bypass CORS)...")
            try:
                req = urllib.request.Request(
                    url, 
                    data="test content".encode('utf-8'), 
                    headers={"Content-Type": "text/plain"}, 
                    method="PUT"
                )
                with urllib.request.urlopen(req) as response:
                    print(f"✅ Upload successful! Status: {response.status}")
            except urllib.error.HTTPError as e:
                print(f"❌ Upload failed with status {e.code}")
                print(e.read().decode('utf-8'))
            except Exception as e:
                print(f"❌ Upload failed with exception: {e}")
                
        else:
            print("❌ Failed to generate URL (returned None)")
    except Exception as e:
        print(f"❌ Exception during URL generation: {e}")

if __name__ == "__main__":
    test_r2()
