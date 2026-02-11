"""
Juryline -- Reviews Router
Judge queue, review CRUD, and organizer review listing.
"""

from fastapi import APIRouter, Depends, HTTPException
from app.utils.dependencies import require_judge, require_organizer, get_current_user
from app.models.review import ReviewCreate, ReviewUpdate
from app.services.review_service import review_service

router = APIRouter(tags=["reviews"])


# ── Judge Queue ──

@router.get("/judges/queue/{event_id}")
async def get_judge_queue(event_id: str, user: dict = Depends(require_judge)):
    """
    Get the judge's review queue for an event.
    Returns submissions with form_data_display, form_fields, review status,
    and resume position.
    """
    return await review_service.get_judge_queue(user["id"], event_id)


# ── Review CRUD ──

@router.post("/reviews")
async def create_review(body: ReviewCreate, user: dict = Depends(require_judge)):
    """Submit or save a review for a submission."""
    return await review_service.create_or_update_review(
        judge_id=user["id"],
        submission_id=body.submission_id,
        scores=body.scores,
        notes=body.notes,
    )


@router.put("/reviews/{review_id}")
async def update_review(
    review_id: str, body: ReviewUpdate, user: dict = Depends(require_judge)
):
    """Update an existing review."""
    return await review_service.update_review(
        review_id=review_id,
        judge_id=user["id"],
        scores=body.scores,
        notes=body.notes,
    )


@router.get("/reviews/{review_id}")
async def get_review(review_id: str, user: dict = Depends(get_current_user)):
    """Get a single review. Judges can see their own, organizers can see all."""
    review = await review_service.get_review(review_id)

    # Access control: judge can only see own reviews, organizer can see all
    if user["role"] == "judge" and review["judge_id"] != user["id"]:
        raise HTTPException(403, "Access denied")
    elif user["role"] == "participant":
        raise HTTPException(403, "Access denied")

    return review


# ── Organizer: All Reviews for Event ──

@router.get("/events/{event_id}/reviews")
async def list_event_reviews(
    event_id: str, user: dict = Depends(require_organizer)
):
    """List all reviews for an event (organizer only)."""
    return await review_service.list_event_reviews(event_id)
