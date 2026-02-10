"""
Juryline — FastAPI Dependencies
Token verification via Supabase auth.get_user, current user extraction,
and role-based guards.
"""

from fastapi import Depends, HTTPException, Header
from typing import Optional

from app.supabase_client import supabase


async def get_current_user(authorization: str = Header(...)) -> dict:
    """
    Extract and verify the current user from the Authorization header.
    Expects: 'Bearer <supabase_jwt>'
    Uses Supabase auth.get_user() so it works regardless of JWT algorithm
    (HS256, ES256, etc.).
    Returns the user's profile from the profiles table.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.replace("Bearer ", "")

    try:
        auth_response = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not auth_response or not auth_response.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = auth_response.user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: no subject")

    # Fetch profile from Supabase
    result = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User profile not found")

    return result.data[0]


async def require_organizer(user: dict = Depends(get_current_user)) -> dict:
    """Guard: only organizers can access this endpoint."""
    if user["role"] != "organizer":
        raise HTTPException(status_code=403, detail="Organizer access required")
    return user


async def require_judge(user: dict = Depends(get_current_user)) -> dict:
    """Guard: only judges can access this endpoint."""
    if user["role"] != "judge":
        raise HTTPException(status_code=403, detail="Judge access required")
    return user


async def require_participant(user: dict = Depends(get_current_user)) -> dict:
    """Guard: only participants can access this endpoint."""
    if user["role"] != "participant":
        raise HTTPException(status_code=403, detail="Participant access required")
    return user


def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """Optional auth — returns user or None if no token provided."""
    if not authorization:
        return None

    try:
        token = authorization.replace("Bearer ", "")
        auth_response = supabase.auth.get_user(token)

        if not auth_response or not auth_response.user:
            return None

        user_id = auth_response.user.id
        if not user_id:
            return None

        result = supabase.table("profiles").select("*").eq("id", user_id).execute()
        return result.data[0] if result.data else None
    except Exception:
        return None
