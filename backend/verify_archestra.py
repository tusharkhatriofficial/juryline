import asyncio
import sys
import os

# Add backend to sys.path so we can import app modules
sys.path.append(os.getcwd())

from app.services.archestra_service import archestra_service
from app.config import get_settings

async def main():
    print("Checking Archestra configuration...")
    try:
        settings = get_settings()
        print(f"Base URL: {settings.archestra_base_url}")
        if settings.archestra_api_key:
             print(f"API Key: {settings.archestra_api_key[:10]}...")
        else:
             print("API Key: <MISSING>")
        
        print("\nRunning health check...")
        result = await archestra_service.health_check()
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error during verification: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
