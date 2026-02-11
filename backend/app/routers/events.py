"""
Juryline -- Events Router
CRUD for events with status transitions and ownership checks.
"""

from fastapi import APIRouter, HTTPException, Depends
from app.supabase_client import supabase
from app.utils.dependencies import get_current_user, require_organizer
from app.models.event import EventCreate, EventUpdate, EventStatusUpdate
from app.services.archestra_service import archestra_service
from app.services.submission_service import submission_service

router = APIRouter(prefix="/events", tags=["events"])


def _verify_event_owner(event: dict, user_id: str):
    """Raise 403 if the user is not the event organizer."""
    if event["organizer_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not the event organizer")


@router.post("")
async def create_event(
    body: EventCreate,
    user: dict = Depends(require_organizer),
):
    """Create a new event (organizer only)."""
    data = body.model_dump()
    data["organizer_id"] = user["id"]
    # Convert datetimes to ISO strings
    data["start_at"] = data["start_at"].isoformat()
    data["end_at"] = data["end_at"].isoformat()

    result = supabase.table("events").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create event")
    return result.data[0]


@router.get("")
async def list_events(user: dict = Depends(get_current_user)):
    """List events. Organizers see their own; others see open/judging/closed."""
    if user["role"] == "organizer":
        result = (
            supabase.table("events")
            .select("*")
            .eq("organizer_id", user["id"])
            .order("created_at", desc=True)
            .execute()
        )
    else:
        result = (
            supabase.table("events")
            .select("*")
            .neq("status", "draft")
            .order("created_at", desc=True)
            .execute()
        )
    return result.data


@router.get("/{event_id}")
async def get_event(event_id: str, _user: dict = Depends(get_current_user)):
    """Get a single event by ID."""
    result = supabase.table("events").select("*").eq("id", event_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    return result.data


@router.put("/{event_id}")
async def update_event(
    event_id: str,
    body: EventUpdate,
    user: dict = Depends(require_organizer),
):
    """Update an event (organizer owner only)."""
    event = supabase.table("events").select("*").eq("id", event_id).single().execute()
    if not event.data:
        raise HTTPException(status_code=404, detail="Event not found")
    _verify_event_owner(event.data, user["id"])

    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Convert datetimes
    for key in ["start_at", "end_at"]:
        if key in update_data and update_data[key] is not None:
            update_data[key] = update_data[key].isoformat()

    result = (
        supabase.table("events")
        .update(update_data)
        .eq("id", event_id)
        .execute()
    )
    return result.data[0]


@router.delete("/{event_id}")
async def delete_event(event_id: str, user: dict = Depends(require_organizer)):
    """Delete a draft event (organizer owner only)."""
    event = supabase.table("events").select("*").eq("id", event_id).single().execute()
    if not event.data:
        raise HTTPException(status_code=404, detail="Event not found")
    _verify_event_owner(event.data, user["id"])

    if event.data["status"] != "draft":
        raise HTTPException(status_code=400, detail="Can only delete draft events")

    supabase.table("events").delete().eq("id", event_id).execute()
    return {"message": "Event deleted"}


@router.patch("/{event_id}/status")
async def transition_status(
    event_id: str,
    body: EventStatusUpdate,
    user: dict = Depends(require_organizer),
):
    """Transition event status with validation."""
    event = supabase.table("events").select("*").eq("id", event_id).single().execute()
    if not event.data:
        raise HTTPException(status_code=404, detail="Event not found")
    _verify_event_owner(event.data, user["id"])

    current = event.data["status"]
    new_status = body.status

    valid_transitions = {
        "draft": ["open"],
        "open": ["judging"],
        "judging": ["closed"],
    }

    if new_status not in valid_transitions.get(current, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{current}' to '{new_status}'",
        )

    # Pre-conditions for opening
    if new_status == "open":
        criteria = (
            supabase.table("criteria")
            .select("id")
            .eq("event_id", event_id)
            .execute()
        )
        if not criteria.data:
            raise HTTPException(
                status_code=400,
                detail="Add at least 1 judging criterion before opening",
            )
        fields = (
            supabase.table("form_fields")
            .select("id")
            .eq("event_id", event_id)
            .execute()
        )
        if not fields.data:
            raise HTTPException(
                status_code=400,
                detail="Add at least 1 form field before opening",
            )

    supabase.table("events").update({"status": new_status}).eq("id", event_id).execute()

    # Auto-assign judges when transitioning to "judging"
    assignment_info = None
    if new_status == "judging":
        try:
            # Get judges
            ej_result = (
                supabase.table("event_judges")
                .select("judge_id, profiles:judge_id(id, name)")
                .eq("event_id", event_id)
                .execute()
            )
            judges = [
                {"id": ej["judge_id"], "name": (ej.get("profiles") or {}).get("name", ""), "current_load": 0}
                for ej in (ej_result.data or [])
            ]

            # Get submissions
            subs_result = (
                supabase.table("submissions")
                .select("id, form_data")
                .eq("event_id", event_id)
                .execute()
            )
            submissions = subs_result.data or []

            # Get form fields for project name
            form_fields = (
                supabase.table("form_fields")
                .select("*")
                .eq("event_id", event_id)
                .order("sort_order")
                .execute()
            ).data or []

            for sub in submissions:
                display = submission_service.enrich_for_display(sub.get("form_data", {}), form_fields)
                sub["project_name"] = next(
                    (d["value"] for d in display if d["field_type"] == "short_text" and d["value"]),
                    f"Submission {sub['id'][:8]}",
                )

            if judges and submissions:
                result = await archestra_service.assign_judges(
                    judges=judges,
                    submissions=submissions,
                    judges_per_submission=event.data.get("judges_per_submission", 2),
                )

                # Clear old and insert new
                supabase.table("judge_assignments").delete().eq("event_id", event_id).execute()
                new_assigns = [
                    {"event_id": event_id, "judge_id": a["judge_id"], "submission_id": a["submission_id"], "status": "pending"}
                    for a in result.get("assignments", [])
                ]
                if new_assigns:
                    supabase.table("judge_assignments").insert(new_assigns).execute()

                assignment_info = {
                    "assignments_created": len(new_assigns),
                    "strategy": result.get("strategy", "unknown"),
                }
        except Exception as e:
            # Don't block the transition if assignment fails
            assignment_info = {"error": str(e)}

    response = {"status": new_status, "message": f"Event transitioned to '{new_status}'"}
    if assignment_info:
        response["judge_assignments"] = assignment_info
    return response
