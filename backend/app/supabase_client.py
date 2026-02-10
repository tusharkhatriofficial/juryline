"""
Juryline — Supabase Client
Creates the Supabase client using the service role key.
Backend always uses service role to bypass RLS.
"""

from supabase import create_client, Client
from app.config import get_settings


def get_supabase_client() -> Client:
    """Get Supabase client with service role key (bypasses RLS)."""
    settings = get_settings()
    return create_client(
        settings.supabase_url,
        settings.supabase_service_key,
    )


# Singleton client for use across the app
supabase: Client = get_supabase_client()
