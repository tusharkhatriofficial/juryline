"""
Juryline -- Archestra Router
Endpoints for AI-powered orchestration: judge assignment, progress tracking,
score aggregation, feedback generation. Falls back to deterministic logic
when Archestra is not configured.
"""

from fastapi import APIRouter, HTTPException, Depends
from app.supabase_client import supabase
from app.utils.dependencies import require_organizer, get_current_user
from app.services.archestra_service import archestra_service
from app.services.submission_service import submission_service

router = APIRouter(prefix="/archestra", tags=["archestra"])


@router.get("/status")
async def archestra_status(_user: dict = Depends(get_current_user)):
    """Check Archestra platform health."""
    return await archestra_service.health_check()


@router.post("/assign-judges/{event_id}")
async def assign_judges(event_id: str, user: dict = Depends(require_organizer)):
    """
    Trigger judge assignment for an event.
    Uses Archestra Assignment agent or deterministic round-robin fallback.
    Saves assignments to judge_assignments table.
    """
    # Verify event exists and belongs to organizer
    event = supabase.table("events").select("*").eq("id", event_id).single().execute()
    if not event.data:
        raise HTTPException(404, "Event not found")
    if event.data["organizer_id"] != user["id"]:
        raise HTTPException(403, "Not the event organizer")
    if event.data["status"] not in ("judging", "open"):
        raise HTTPException(400, "Event must be open or in judging phase")

    # Get judges for this event
    ej_result = (
        supabase.table("event_judges")
        .select("judge_id, profiles:judge_id(id, name, email)")
        .eq("event_id", event_id)
        .execute()
    )
    judges_raw = ej_result.data or []
    if not judges_raw:
        raise HTTPException(400, "No judges invited to this event")

    # Get current assignment counts for load balancing
    existing_assigns = (
        supabase.table("judge_assignments")
        .select("judge_id")
        .eq("event_id", event_id)
        .execute()
    )
    load_map: dict[str, int] = {}
    for a in (existing_assigns.data or []):
        load_map[a["judge_id"]] = load_map.get(a["judge_id"], 0) + 1

    judges = []
    for ej in judges_raw:
        profile = ej.get("profiles") or {}
        jid = ej["judge_id"]
        judges.append({
            "id": jid,
            "name": profile.get("name", ""),
            "current_load": load_map.get(jid, 0),
        })

    # Get submissions
    subs_result = (
        supabase.table("submissions")
        .select("id, form_data")
        .eq("event_id", event_id)
        .execute()
    )
    submissions = subs_result.data or []
    if not submissions:
        raise HTTPException(400, "No submissions to assign")

    # Enrich submissions with project_name for display
    form_fields = (
        supabase.table("form_fields")
        .select("*")
        .eq("event_id", event_id)
        .order("sort_order")
        .execute()
    ).data or []

    for sub in submissions:
        sub["event_id"] = event_id  # enrich_for_display needs event_id
        enriched = await submission_service.enrich_for_display(sub)
        display = enriched.get("form_data_display", [])
        # Use first text field as project_name
        sub["project_name"] = next(
            (d["value"] for d in display if d["field_type"] in ("short_text",) and d["value"]),
            f"Submission {sub['id'][:8]}",
        )

    # Call Archestra or fallback
    result = await archestra_service.assign_judges(
        judges=judges,
        submissions=submissions,
        judges_per_submission=event.data.get("judges_per_submission", 2),
    )

    # Clear existing assignments for this event, then insert new ones
    supabase.table("judge_assignments").delete().eq("event_id", event_id).execute()

    new_assignments = []
    for a in result.get("assignments", []):
        new_assignments.append({
            "event_id": event_id,
            "judge_id": a["judge_id"],
            "submission_id": a["submission_id"],
            "status": "pending",
        })

    if new_assignments:
        supabase.table("judge_assignments").insert(new_assignments).execute()

    return {
        "message": f"Assigned {len(new_assignments)} judge-submission pairs",
        "strategy": result.get("strategy", "unknown"),
        "judge_loads": result.get("judge_loads", {}),
        "assignment_count": len(new_assignments),
    }


@router.get("/progress/{event_id}")
async def get_progress(event_id: str, user: dict = Depends(require_organizer)):
    """Get judging progress for an event."""
    event = supabase.table("events").select("organizer_id").eq("id", event_id).single().execute()
    if not event.data:
        raise HTTPException(404, "Event not found")
    if event.data["organizer_id"] != user["id"]:
        raise HTTPException(403, "Not the event organizer")

    assigns = (
        supabase.table("judge_assignments")
        .select("*")
        .eq("event_id", event_id)
        .execute()
    )
    assignments = assigns.data or []

    if not assignments:
        return {
            "progress_percent": 0,
            "completed_reviews": 0,
            "total_reviews": 0,
            "judges_status": [],
            "pending_submissions": [],
            "all_complete": False,
            "reminders": [],
        }

    return await archestra_service.get_progress(assignments)


@router.post("/aggregate/{event_id}")
async def aggregate_scores(event_id: str, user: dict = Depends(require_organizer)):
    """
    Aggregate all review scores for an event into a leaderboard.
    Uses weighted averages from criteria.
    """
    event = supabase.table("events").select("*").eq("id", event_id).single().execute()
    if not event.data:
        raise HTTPException(404, "Event not found")
    if event.data["organizer_id"] != user["id"]:
        raise HTTPException(403, "Not the event organizer")

    # Get criteria
    criteria = (
        supabase.table("criteria")
        .select("*")
        .eq("event_id", event_id)
        .order("sort_order")
        .execute()
    ).data or []

    if not criteria:
        raise HTTPException(400, "No criteria defined")

    # Get submissions
    subs = (
        supabase.table("submissions")
        .select("*")
        .eq("event_id", event_id)
        .execute()
    ).data or []

    # Get form fields for project name extraction
    form_fields = (
        supabase.table("form_fields")
        .select("*")
        .eq("event_id", event_id)
        .order("sort_order")
        .execute()
    ).data or []

    # Get all reviews
    reviews = (
        supabase.table("reviews")
        .select("*")
        .eq("event_id", event_id)
        .execute()
    ).data or []

    # Build submissions_with_reviews
    review_map: dict[str, list] = {}
    for r in reviews:
        sid = r["submission_id"]
        if sid not in review_map:
            review_map[sid] = []
        review_map[sid].append(r)

    submissions_with_reviews = []
    for sub in subs:
        enriched = await submission_service.enrich_for_display(sub)
        display = enriched.get("form_data_display", [])
        project_name = next(
            (d["value"] for d in display if d["field_type"] in ("short_text",) and d["value"]),
            f"Submission {sub['id'][:8]}",
        )
        submissions_with_reviews.append({
            "id": sub["id"],
            "project_name": project_name,
            "reviews": review_map.get(sub["id"], []),
        })

    return await archestra_service.aggregate_scores(criteria, submissions_with_reviews)


@router.post("/feedback/{submission_id}")
async def generate_feedback(submission_id: str, user: dict = Depends(require_organizer)):
    """Generate AI-synthesized feedback for a submission."""
    sub = (
        supabase.table("submissions")
        .select("*")
        .eq("id", submission_id)
        .single()
        .execute()
    )
    if not sub.data:
        raise HTTPException(404, "Submission not found")

    event_id = sub.data["event_id"]

    # Verify organizer owns event
    event = supabase.table("events").select("organizer_id").eq("id", event_id).single().execute()
    if not event.data or event.data["organizer_id"] != user["id"]:
        raise HTTPException(403, "Not the event organizer")

    criteria = (
        supabase.table("criteria")
        .select("*")
        .eq("event_id", event_id)
        .execute()
    ).data or []

    reviews = (
        supabase.table("reviews")
        .select("*")
        .eq("submission_id", submission_id)
        .execute()
    ).data or []

    if not reviews:
        raise HTTPException(400, "No reviews exist for this submission")

    return await archestra_service.generate_feedback(
        submission=sub.data,
        reviews=reviews,
        criteria=criteria,
    )
