"""
Juryline — Application Configuration
Loads environment variables via pydantic-settings.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Supabase ──
    supabase_url: str
    supabase_service_key: str
    supabase_jwt_secret: str

    # ── Cloudflare R2 ──
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "juryline-uploads"
    r2_public_url: str = ""

    # ── App ──
    app_env: str = "development"
    frontend_url: str = "http://localhost:3000"
    port: int = 8000

    # ── Archestra (Phase 06) ──
    archestra_api_key: str = ""
    archestra_base_url: str = ""
    archestra_ingest_prompt_id: str = ""
    archestra_assign_prompt_id: str = ""
    archestra_progress_prompt_id: str = ""
    archestra_aggregate_prompt_id: str = ""
    archestra_feedback_prompt_id: str = ""

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def r2_endpoint_url(self) -> str:
        return f"https://{self.r2_account_id}.r2.cloudflarestorage.com"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
