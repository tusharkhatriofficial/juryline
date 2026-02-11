"""
Juryline -- Dashboard Router
Organizer dashboard, leaderboard, statistics, and CSV export.
"""

import io
import csv
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from app.supabase_client import supabase
from app.utils.dependencies import require_organizer
from app.services.scoring_service import scoring_service

router = APIRouter(prefix="/events/{event_id}", tags=["dashboard"])


@router.get("/dashboard")
async def get_dashboard(event_id: str, user: dict = Depends(require_organizer)):
    """Get complete dashboard data: event, stats, judge progress, leaderboard."""
    # Verify ownership
    event = supabase.table("events").select("organizer_id").eq("id", event_id).single().execute()
    if not event.data:
        raise HTTPException(404, "Event not found")
    if event.data["organizer_id"] != user["id"]:
        raise HTTPException(403, "Not the event organizer")

    return await scoring_service.get_full_dashboard(event_id)


@router.get("/leaderboard")
async def get_leaderboard(event_id: str, user: dict = Depends(require_organizer)):
    """Get ranked leaderboard with weighted scores."""
    # Verify ownership
    event = supabase.table("events").select("organizer_id").eq("id", event_id).single().execute()
    if not event.data:
        raise HTTPException(404, "Event not found")
    if event.data["organizer_id"] != user["id"]:
        raise HTTPException(403, "Not the event organizer")

    return await scoring_service.compute_leaderboard(event_id)


@router.get("/judge-progress")
async def get_judge_progress(event_id: str, user: dict = Depends(require_organizer)):
    """Get per-judge progress statistics."""
    # Verify ownership
    event = supabase.table("events").select("organizer_id").eq("id", event_id).single().execute()
    if not event.data:
        raise HTTPException(404, "Event not found")
    if event.data["organizer_id"] != user["id"]:
        raise HTTPException(403, "Not the event organizer")

    return await scoring_service.compute_judge_progress(event_id)


@router.get("/bias-report")
async def get_bias_report(event_id: str, user: dict = Depends(require_organizer)):
    """Get judge bias analysis report."""
    # Verify ownership
    event = supabase.table("events").select("organizer_id").eq("id", event_id).single().execute()
    if not event.data:
        raise HTTPException(404, "Event not found")
    if event.data["organizer_id"] != user["id"]:
        raise HTTPException(403, "Not the event organizer")

    return await scoring_service.compute_bias_report(event_id)


@router.get("/export")
async def export_csv(event_id: str, user: dict = Depends(require_organizer)):
    """Export leaderboard and scores to CSV file."""
    # Verify ownership
    event_result = supabase.table("events").select("*").eq("id", event_id).single().execute()
    if not event_result.data:
        raise HTTPException(404, "Event not found")
    if event_result.data["organizer_id"] != user["id"]:
        raise HTTPException(403, "Not the event organizer")

    event = event_result.data

    # Get leaderboard and criteria
    leaderboard = await scoring_service.compute_leaderboard(event_id)
    criteria_result = (
        supabase.table("criteria")
        .select("*")
        .eq("event_id", event_id)
        .order("sort_order")
        .execute()
    )
    criteria = criteria_result.data or []

    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    header = ["Rank", "Project Name", "Weighted Score"]
    for crit in criteria:
        header.append(f"{crit['name']} (avg)")
    header.append("Review Count")
    writer.writerow(header)

    # Data rows
    for entry in leaderboard:
        row = [
            entry["rank"],
            entry["project_name"],
            entry["weighted_score"],
        ]
        for crit in criteria:
            crit_score = entry["criteria_scores"].get(crit["id"], {})
            row.append(crit_score.get("average", ""))
        row.append(entry["review_count"])
        writer.writerow(row)

    # Return as downloadable file
    filename = f"leaderboard_{event.get('name', 'event').replace(' ', '_')}_{event_id[:8]}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
