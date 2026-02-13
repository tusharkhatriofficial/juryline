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
        # Step 1: Use generate_link to create the user + get the invite link
        # (generate_link does NOT send an email — it only returns the link)
        result = supabase.auth.admin.generate_link({
            "type": "magiclink",
            "email": body.email,
            "options": {
                "data": {"name": body.name, "role": "judge"},
                "redirect_to": redirect_url,
            },
        })

        judge_user_id = result.user.id if result.user else None
        invite_link = result.properties.action_link if result.properties else None

        if not judge_user_id:
            raise HTTPException(status_code=400, detail="Failed to create judge user")

        # Step 2: Send a magic link email via Supabase /auth/v1/otp REST API
        # The Python SDK's invite_user_by_email doesn't work reliably,
        # but the OTP endpoint sends real emails through Supabase's mailer.
        email_sent = False
        email_error = None
        try:
            async with httpx.AsyncClient() as client:
                otp_resp = await client.post(
                    f"{settings.supabase_url}/auth/v1/otp",
                    headers={
                        "apikey": settings.supabase_service_key,
                        "Authorization": f"Bearer {settings.supabase_service_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "email": body.email,
                        "options": {
                            "should_create_user": False,
                            "data": {"name": body.name, "role": "judge"},
                            "email_redirect_to": redirect_url,
                        },
                    },
                    timeout=10,
                )
                
                if otp_resp.status_code == 200:
                    email_sent = True
                    logger.info(f"Successfully sent magic link email to {body.email}")
                elif otp_resp.status_code == 429:
                    email_error = "Rate limit exceeded. Please wait 60 seconds and try again."
                    logger.warning(f"Rate limit hit when sending email to {body.email}")
                else:
                    email_error = f"Email service returned status {otp_resp.status_code}: {otp_resp.text}"
                    logger.error(f"Failed to send email to {body.email}: {email_error}")
                    
        except httpx.TimeoutException:
            email_error = "Email service timeout. Please try again."
            logger.error(f"Timeout sending email to {body.email}")
        except httpx.RequestError as e:
            email_error = f"Email service connection error: {str(e)}"
            logger.error(f"Request error sending email to {body.email}: {str(e)}")
        except Exception as e:
            email_error = f"Email sending failed: {str(e)}"
            logger.error(f"Unexpected error sending email to {body.email}: {str(e)}")

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
            "invite_link": invite_link,
            "judge_id": judge_user_id,
            "email_sent": email_sent,
            "email_error": email_error,
        }

    except HTTPException:
        raise
    except Exception as e:
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
