"""
Juryline -- Judges Router
Invite and manage judges for events via Supabase magic links.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.supabase_client import supabase
from app.config import get_settings
from app.utils.dependencies import require_organizer

router = APIRouter(prefix="/events/{event_id}/judges", tags=["judges"])


class JudgeInviteRequest(BaseModel):
    email: EmailStr
    name: str


@router.get("")
async def list_judges(event_id: str, user: dict = Depends(require_organizer)):
    """List all invited judges for an event."""
    result = (
        supabase.table("event_judges")
        .select("*, profiles:judge_id(id, name, email, avatar_url)")
        .eq("event_id", event_id)
        .execute()
    )
    return result.data


@router.post("/invite")
async def invite_judge(
    event_id: str,
    body: JudgeInviteRequest,
    user: dict = Depends(require_organizer),
):
    """Invite a judge via magic link. Creates user if not exists."""
    settings = get_settings()

    try:
        # Generate magic link (creates user if they do not exist)
        result = supabase.auth.admin.generate_link({
            "type": "magiclink",
            "email": body.email,
            "options": {
                "data": {"name": body.name, "role": "judge"},
                "redirect_to": f"{settings.frontend_url}/auth/callback",
            },
        })

        judge_user_id = result.user.id if result.user else None
        invite_link = result.properties.action_link if result.properties else None

        if not judge_user_id:
            raise HTTPException(status_code=400, detail="Failed to create judge user")

        # Check if already invited
        existing = (
            supabase.table("event_judges")
            .select("id")
            .eq("event_id", event_id)
            .eq("judge_id", judge_user_id)
            .execute()
        )

        if existing.data:
            return {
                "message": "Judge already invited",
                "invite_link": invite_link,
            }

        # Create event_judges record
        supabase.table("event_judges").insert({
            "event_id": event_id,
            "judge_id": judge_user_id,
            "invite_status": "pending",
        }).execute()

        return {
            "message": "Judge invited successfully",
            "invite_link": invite_link,
            "judge_id": judge_user_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{judge_record_id}")
async def remove_judge(
    event_id: str,
    judge_record_id: str,
    user: dict = Depends(require_organizer),
):
    """Remove a judge from an event."""
    supabase.table("event_judges").delete().eq("id", judge_record_id).eq("event_id", event_id).execute()
    return {"message": "Judge removed"}
