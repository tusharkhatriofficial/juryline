"""
Juryline -- Criteria Router
CRUD for judging criteria. Locked when event status != draft.
"""

from fastapi import APIRouter, HTTPException, Depends
from app.supabase_client import supabase
from app.utils.dependencies import require_organizer, get_current_user
from app.models.review import CriterionCreate, CriterionUpdate

router = APIRouter(prefix="/events/{event_id}/criteria", tags=["criteria"])


def _check_draft(event_id: str):
    """Ensure the event is in draft status."""
    event = supabase.table("events").select("status").eq("id", event_id).single().execute()
    if not event.data:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.data["status"] != "draft":
        raise HTTPException(
            status_code=400,
            detail="Criteria are locked after the event opens",
        )


@router.post("")
async def add_criterion(
    event_id: str,
    body: CriterionCreate,
    user: dict = Depends(require_organizer),
):
    """Add a judging criterion to an event."""
    _check_draft(event_id)

    existing = (
        supabase.table("criteria")
        .select("sort_order")
        .eq("event_id", event_id)
        .order("sort_order", desc=True)
        .limit(1)
        .execute()
    )
    next_order = (existing.data[0]["sort_order"] + 1) if existing.data else 0

    data = body.model_dump(exclude_none=True)
    data["event_id"] = event_id
    data["sort_order"] = next_order

    result = supabase.table("criteria").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to add criterion")
    return result.data[0]


@router.get("")
async def list_criteria(event_id: str, _user: dict = Depends(get_current_user)):
    """List all judging criteria for an event."""
    result = (
        supabase.table("criteria")
        .select("*")
        .eq("event_id", event_id)
        .order("sort_order")
        .execute()
    )
    return result.data


@router.put("/{criterion_id}")
async def update_criterion(
    event_id: str,
    criterion_id: str,
    body: CriterionUpdate,
    user: dict = Depends(require_organizer),
):
    """Update a judging criterion."""
    _check_draft(event_id)

    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        supabase.table("criteria")
        .update(update_data)
        .eq("id", criterion_id)
        .eq("event_id", event_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Criterion not found")
    return result.data[0]


@router.delete("/{criterion_id}")
async def delete_criterion(
    event_id: str,
    criterion_id: str,
    user: dict = Depends(require_organizer),
):
    """Delete a judging criterion."""
    _check_draft(event_id)
    supabase.table("criteria").delete().eq("id", criterion_id).eq("event_id", event_id).execute()
    return {"message": "Criterion deleted"}
