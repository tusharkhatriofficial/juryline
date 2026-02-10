"""
Juryline -- Profile Router
Handles user profile read and update.
"""

from fastapi import APIRouter, HTTPException, Depends
from app.supabase_client import supabase
from app.utils.dependencies import get_current_user
from app.models.user import ProfileUpdate

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me")
async def get_profile(user: dict = Depends(get_current_user)):
    """Get the current user's full profile."""
    return user


@router.patch("/me")
async def update_profile(
    update: ProfileUpdate,
    user: dict = Depends(get_current_user),
):
    """Update the current user's profile (name, avatar)."""
    update_data = update.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        supabase.table("profiles")
        .update(update_data)
        .eq("id", user["id"])
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    return result.data[0]


@router.get("/{user_id}")
async def get_profile_by_id(
    user_id: str,
    _user: dict = Depends(get_current_user),
):
    """Get any user's public profile (requires auth)."""
    result = (
        supabase.table("profiles")
        .select("id, name, role, avatar_url, created_at")
        .eq("id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    return result.data[0]
