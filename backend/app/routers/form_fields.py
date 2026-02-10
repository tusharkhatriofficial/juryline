"""
Juryline -- Form Fields Router
CRUD for dynamic form fields with reorder and duplicate support.
Fields are locked when event status != draft.
"""

from fastapi import APIRouter, HTTPException, Depends
from app.supabase_client import supabase
from app.utils.dependencies import require_organizer, get_current_user
from app.models.form_field import FormFieldCreate, FormFieldUpdate, FormFieldReorder

router = APIRouter(prefix="/events/{event_id}/form-fields", tags=["form-fields"])


def _check_draft(event_id: str):
    """Ensure the event is in draft status (fields are locked otherwise)."""
    event = supabase.table("events").select("status").eq("id", event_id).single().execute()
    if not event.data:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.data["status"] != "draft":
        raise HTTPException(
            status_code=400,
            detail="Form fields are locked after the event opens",
        )


@router.post("")
async def add_field(
    event_id: str,
    body: FormFieldCreate,
    user: dict = Depends(require_organizer),
):
    """Add a new form field to an event."""
    _check_draft(event_id)

    # Get current max sort_order
    existing = (
        supabase.table("form_fields")
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

    result = supabase.table("form_fields").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to add field")
    return result.data[0]


@router.get("")
async def list_fields(event_id: str, _user: dict = Depends(get_current_user)):
    """List all form fields for an event, ordered by sort_order."""
    result = (
        supabase.table("form_fields")
        .select("*")
        .eq("event_id", event_id)
        .order("sort_order")
        .execute()
    )
    return result.data


@router.put("/{field_id}")
async def update_field(
    event_id: str,
    field_id: str,
    body: FormFieldUpdate,
    user: dict = Depends(require_organizer),
):
    """Update a form field."""
    _check_draft(event_id)

    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        supabase.table("form_fields")
        .update(update_data)
        .eq("id", field_id)
        .eq("event_id", event_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Field not found")
    return result.data[0]


@router.delete("/{field_id}")
async def delete_field(
    event_id: str,
    field_id: str,
    user: dict = Depends(require_organizer),
):
    """Delete a form field."""
    _check_draft(event_id)
    supabase.table("form_fields").delete().eq("id", field_id).eq("event_id", event_id).execute()
    return {"message": "Field deleted"}


@router.put("/reorder")
async def reorder_fields(
    event_id: str,
    body: FormFieldReorder,
    user: dict = Depends(require_organizer),
):
    """Batch reorder form fields."""
    _check_draft(event_id)

    for item in body.order:
        supabase.table("form_fields").update({"sort_order": item.sort_order}).eq("id", item.id).execute()

    return {"message": "Fields reordered"}


@router.post("/duplicate/{field_id}")
async def duplicate_field(
    event_id: str,
    field_id: str,
    user: dict = Depends(require_organizer),
):
    """Duplicate a form field with '(Copy)' suffix."""
    _check_draft(event_id)

    original = (
        supabase.table("form_fields")
        .select("*")
        .eq("id", field_id)
        .eq("event_id", event_id)
        .single()
        .execute()
    )
    if not original.data:
        raise HTTPException(status_code=404, detail="Field not found")

    # Get next sort_order
    existing = (
        supabase.table("form_fields")
        .select("sort_order")
        .eq("event_id", event_id)
        .order("sort_order", desc=True)
        .limit(1)
        .execute()
    )
    next_order = (existing.data[0]["sort_order"] + 1) if existing.data else 0

    new_field = {
        "event_id": event_id,
        "label": original.data["label"] + " (Copy)",
        "field_type": original.data["field_type"],
        "description": original.data.get("description"),
        "is_required": original.data["is_required"],
        "options": original.data.get("options"),
        "validation": original.data.get("validation"),
        "sort_order": next_order,
    }

    result = supabase.table("form_fields").insert(new_field).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to duplicate field")
    return result.data[0]
