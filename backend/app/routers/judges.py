"""
Juryline -- Judges Router
Invite and manage judges for events via Supabase magic links.
"""

import logging
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.supabase_client import supabase
from app.config import get_settings
from app.utils.dependencies import require_organizer, get_current_user

router = APIRouter(prefix="/events/{event_id}/judges", tags=["judges"])
logger = logging.getLogger(__name__)


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
    redirect_url = f"{settings.frontend_url}/auth/confirm?event_id={event_id}"

    try:
        # Check if user already exists by querying profiles (assumes trigger syncs auth.users -> profiles)
        existing_user = (
            supabase.table("profiles")
            .select("id")
            .eq("email", body.email)
            .maybe_single()
            .execute()
        )

        judge_user_id = None
        
        # Defensive check: if query failed completely
        if existing_user is None:
             raise HTTPException(status_code=500, detail="Database query failed: existing_user response is None")

        if existing_user.data:
            judge_user_id = existing_user.data["id"]
        else:
            # Create user specifically so we get the ID immediately
            # email_confirm=True avoids sending a "Confirm Email" message if configured
            try:
                user_resp = supabase.auth.admin.create_user({
                    "email": body.email,
                    "email_confirm": True,
                    "user_metadata": {"name": body.name, "role": "judge"},
                })
                judge_user_id = user_resp.user.id
            except Exception as e:
                # If create fails (e.g. race condition), try fetching again
                logger.warning(f"Create user failed, trying to fetch: {e}")
                retry_user = supabase.table("profiles").select("id").eq("email", body.email).maybe_single().execute()
                
                if retry_user is None:
                    raise HTTPException(status_code=500, detail="Database query failed: retry_user response is None")
                    
                if retry_user.data:
                    judge_user_id = retry_user.data["id"]
                else:
                    raise HTTPException(status_code=400, detail=f"Failed to create judge account: {e}")

        if not judge_user_id:
             raise HTTPException(status_code=400, detail="Could not determine user ID for judge")

        # Send Magic Link via standard Supabase SDK (Matches Frontend Logic)
        # This sends the actual email.
        email_sent = False
        email_error = None
        try:
            supabase.auth.sign_in_with_otp({
                "email": body.email,
                "options": {
                    "email_redirect_to": redirect_url,
                    # We already created the user, or they exist.
                    # We just want to send the magic link.
                    "should_create_user": False 
                }
            })
            email_sent = True
            logger.info(f"Successfully sent magic link to {body.email}")
        except Exception as e:
            # If rate limited, we still record the invite but warn
            email_error = str(e)
            logger.error(f"Failed to send magic link to {body.email}: {e}")

        # Check if already invited to THIS event
        existing_invite = (
            supabase.table("event_judges")
            .select("id")
            .eq("event_id", event_id)
            .eq("judge_id", judge_user_id)
            .execute()
        )

        if existing_invite is None:
             raise HTTPException(status_code=500, detail="Database query failed: existing_invite response is None")

        if existing_invite.data:
            return {
                "message": "Judge already invited",
                "judge_id": judge_user_id,
                "email_sent": email_sent,
                "email_error": email_error,
            }

        # Create event_judges record
        supabase.table("event_judges").insert({
            "event_id": event_id,
            "judge_id": judge_user_id,
            "invite_status": "pending",
        }).execute()

        return {
            "message": "Judge invited successfully",
            "judge_id": judge_user_id,
            "email_sent": email_sent,
            "email_error": email_error,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in invite_judge")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/invite-info")
async def get_invite_info(event_id: str, user: dict = Depends(get_current_user)):
    """
    Get invitation details for the current judge.
    Returns event info and organizer name/email so the invite page
    can show "You've been invited by [organizer]".
    """
    # Fetch the event
    event = supabase.table("events").select("id, name, description, status").eq("id", event_id).single().execute()
    if not event.data:
        raise HTTPException(status_code=404, detail="Event not found")

    # Fetch the organizer profile
    organizer = (
        supabase.table("events")
        .select("organizer_id, profiles:organizer_id(name, email)")
        .eq("id", event_id)
        .single()
        .execute()
    )
    organizer_profile = organizer.data.get("profiles") if organizer.data else None

    # Fetch invite status for this judge
    invite = (
        supabase.table("event_judges")
        .select("id, invite_status, invited_at")
        .eq("event_id", event_id)
        .eq("judge_id", user["id"])
        .execute()
    )
    invite_record = invite.data[0] if invite.data else None

    return {
        "event": event.data,
        "organizer": organizer_profile,
        "invite": invite_record,
    }


@router.patch("/accept")
async def accept_invite(event_id: str, user: dict = Depends(get_current_user)):
    """Mark the judge's invitation as accepted."""
    result = (
        supabase.table("event_judges")
        .update({"invite_status": "accepted"})
        .eq("event_id", event_id)
        .eq("judge_id", user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Invitation not found")
    return {"message": "Invitation accepted", "invite": result.data[0]}


@router.delete("/{judge_record_id}")
async def remove_judge(
    event_id: str,
    judge_record_id: str,
    user: dict = Depends(require_organizer),
):
    """Remove a judge from an event."""
    supabase.table("event_judges").delete().eq("id", judge_record_id).eq("event_id", event_id).execute()
    return {"message": "Judge removed"}
