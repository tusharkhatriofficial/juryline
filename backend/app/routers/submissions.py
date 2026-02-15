"""
Juryline -- Submissions Router
CRUD for submissions with dynamic form_data validation.
"""

from fastapi import APIRouter, HTTPException, Depends
from app.supabase_client import supabase
from app.utils.dependencies import (
    get_current_user,
    require_organizer,
    require_participant,
)
from app.models.submission import SubmissionCreate, SubmissionUpdate
from app.services.submission_service import submission_service

router = APIRouter(tags=["submissions"])


# ── Create submission (participant only, event must be open) ──
@router.post("/events/{event_id}/submissions")
async def create_submission(
    event_id: str,
    body: SubmissionCreate,
    user: dict = Depends(require_participant),
):
    """Submit to an event. One submission per participant per event."""
    # Verify event exists and is open
    event_result = (
        supabase.table("events").select("*").eq("id", event_id).execute()
    )
    if not event_result.data:
        raise HTTPException(404, "Event not found")

    event = event_result.data[0]
    if event["status"] != "open":
        raise HTTPException(400, "Event is not accepting submissions")

    # Check for duplicate submission
    existing = (
        supabase.table("submissions")
        .select("id")
        .eq("event_id", event_id)
        .eq("participant_id", user["id"])
        .execute()
    )
    if existing.data:
        raise HTTPException(409, "You already submitted to this event")

    # Validate form_data against form_fields
    await submission_service.validate_form_data(event_id, body.form_data)

    # Archestra AI Validation (Non-blocking)
    from app.services.archestra_service import archestra_service
    import logging
    
    # Create a copy of form_data to avoid mutating the input model directly if needed
    final_form_data = body.form_data.copy()
    
    try:
        validation_result = await archestra_service.validate_submission(final_form_data)
        # Inject AI validation results into metadata field
        final_form_data["_ai_validation"] = validation_result
        if not validation_result.get("valid", True):
            logging.info(f"Archestra flagged submission in event {event_id} with errors/warnings")
    except Exception as e:
        logging.warning(f"Archestra validation failed gracefully: {e}")
        # Continue without validation data if AI fails

    # Insert
    result = (
        supabase.table("submissions")
        .insert(
            {
                "event_id": event_id,
                "participant_id": user["id"],
                "form_data": final_form_data,
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(400, "Failed to create submission")

    return result.data[0]


# ── List submissions for an event (organizer or judge) ──
@router.get("/events/{event_id}/submissions")
async def list_submissions(
    event_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Organizers see all submissions for their event.
    Judges see submissions assigned to them (future: judge_assignments).
    """
    # Verify event exists
    event_result = (
        supabase.table("events").select("*").eq("id", event_id).execute()
    )
    if not event_result.data:
        raise HTTPException(404, "Event not found")

    event = event_result.data[0]

    if user["role"] == "organizer":
        if event["organizer_id"] != user["id"]:
            raise HTTPException(403, "Not the event organizer")
        result = (
            supabase.table("submissions")
            .select("*")
            .eq("event_id", event_id)
            .order("created_at", desc=True)
            .execute()
        )
    elif user["role"] == "judge":
        # For now judges see all submissions in events they are assigned to
        judge_check = (
            supabase.table("event_judges")
            .select("id")
            .eq("event_id", event_id)
            .eq("judge_id", user["id"])
            .execute()
        )
        if not judge_check.data:
            raise HTTPException(403, "You are not a judge for this event")
        result = (
            supabase.table("submissions")
            .select("*")
            .eq("event_id", event_id)
            .order("created_at", desc=True)
            .execute()
        )
    else:
        raise HTTPException(403, "Only organizers and judges can list submissions")

    # Enrich each submission with field labels
    submissions = []
    for sub in result.data or []:
        enriched = await submission_service.enrich_for_display(sub)
        submissions.append(enriched)

    return submissions


# ── Get own submission (participant) ──
@router.get("/events/{event_id}/my-submission")
async def get_my_submission(
    event_id: str,
    user: dict = Depends(require_participant),
):
    """Get the current participant's submission for an event."""
    result = (
        supabase.table("submissions")
        .select("*")
        .eq("event_id", event_id)
        .eq("participant_id", user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "No submission found")

    return await submission_service.enrich_for_display(result.data[0])


# ── Get single submission (any auth) ──
@router.get("/submissions/{submission_id}")
async def get_submission(
    submission_id: str,
    user: dict = Depends(get_current_user),
):
    """Get a submission by ID with enriched display."""
    result = (
        supabase.table("submissions")
        .select("*")
        .eq("id", submission_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Submission not found")

    sub = result.data[0]

    # Access control
    if user["role"] == "participant" and sub["participant_id"] != user["id"]:
        raise HTTPException(403, "Not your submission")

    if user["role"] == "organizer":
        event_result = (
            supabase.table("events")
            .select("organizer_id")
            .eq("id", sub["event_id"])
            .execute()
        )
        if event_result.data and event_result.data[0]["organizer_id"] != user["id"]:
            raise HTTPException(403, "Not the event organizer")

    return await submission_service.enrich_for_display(sub)


# ── Update submission (participant owner, event must be open) ──
@router.put("/submissions/{submission_id}")
async def update_submission(
    submission_id: str,
    body: SubmissionUpdate,
    user: dict = Depends(require_participant),
):
    """Update own submission. Only allowed when the event is still open."""
    result = (
        supabase.table("submissions")
        .select("*")
        .eq("id", submission_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Submission not found")

    sub = result.data[0]
    if sub["participant_id"] != user["id"]:
        raise HTTPException(403, "Not your submission")

    # Check event is still open
    event_result = (
        supabase.table("events")
        .select("status")
        .eq("id", sub["event_id"])
        .execute()
    )
    if not event_result.data or event_result.data[0]["status"] != "open":
        raise HTTPException(400, "Event is no longer accepting edits")

    # Validate
    await submission_service.validate_form_data(sub["event_id"], body.form_data)

    update_result = (
        supabase.table("submissions")
        .update({"form_data": body.form_data})
        .eq("id", submission_id)
        .execute()
    )
    if not update_result.data:
        raise HTTPException(400, "Failed to update submission")

    return update_result.data[0]


# ── Delete submission (participant owner, event must be open) ──
@router.delete("/submissions/{submission_id}")
async def delete_submission(
    submission_id: str,
    user: dict = Depends(require_participant),
):
    """Delete own submission. Only allowed when the event is still open."""
    result = (
        supabase.table("submissions")
        .select("*")
        .eq("id", submission_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Submission not found")

    sub = result.data[0]
    if sub["participant_id"] != user["id"]:
        raise HTTPException(403, "Not your submission")

    event_result = (
        supabase.table("events")
        .select("status")
        .eq("id", sub["event_id"])
        .execute()
    )
    if not event_result.data or event_result.data[0]["status"] != "open":
        raise HTTPException(400, "Event is no longer accepting deletions")

    supabase.table("submissions").delete().eq("id", submission_id).execute()
    return {"message": "Submission deleted"}
