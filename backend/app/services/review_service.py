"""
Juryline -- Review Service
Judge queue building, score validation, and review upsert logic.
"""

import json
from fastapi import HTTPException
from app.supabase_client import supabase


def _ensure_dict(value) -> dict:
    """Safely coerce a value to a dict. Handles JSON strings from JSONB columns."""
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, dict):
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass
    return {}


def _enrich_form_data(form_data, form_fields: list) -> list[dict]:
    """Build display list from form_data and field definitions."""
    raw = _ensure_dict(form_data)
    display = []
    for field in form_fields:
        value = raw.get(field["id"]) or raw.get(field["label"])
        display.append({
            "field_id": field["id"],
            "label": field["label"],
            "field_type": field["field_type"],
            "value": value,
        })
    return display


class ReviewService:
    """Handles judge queue, score validation, and review persistence."""

    async def get_judge_queue(self, judge_id: str, event_id: str) -> dict:
        """
        Build the full judge queue for an event:
        1. Fetch form field definitions (for rendering)
        2. Fetch all assignments for this judge + event
        3. Fetch existing reviews
        4. Merge into a list with review status
        5. Find resume position (first uncompleted)
        """
        # 1. Form fields for this event
        ff_result = (
            supabase.table("form_fields")
            .select("*")
            .eq("event_id", event_id)
            .order("sort_order")
            .execute()
        )
        form_fields = ff_result.data or []

        # 2. Verify judge is assigned to this event
        ej_result = (
            supabase.table("event_judges")
            .select("*")
            .eq("event_id", event_id)
            .eq("judge_id", judge_id)
            .execute()
        )
        if not ej_result.data:
            raise HTTPException(403, "You are not a judge for this event")

        # 3. Get all assignments for this judge + event, with submissions
        assign_result = (
            supabase.table("judge_assignments")
            .select("*, submissions(*)")
            .eq("judge_id", judge_id)
            .eq("event_id", event_id)
            .order("assigned_at")
            .execute()
        )
        assignments = assign_result.data or []

        if not assignments:
            return {
                "total_assigned": 0,
                "completed": 0,
                "remaining": 0,
                "current_index": 0,
                "submissions": [],
            }

        # 4. Get existing reviews by this judge for this event
        rev_result = (
            supabase.table("reviews")
            .select("*")
            .eq("judge_id", judge_id)
            .eq("event_id", event_id)
            .execute()
        )
        reviews_map: dict[str, dict] = {}
        for r in (rev_result.data or []):
            # Ensure scores is always a dict (JSONB may return as string)
            r["scores"] = _ensure_dict(r.get("scores", {}))
            reviews_map[r["submission_id"]] = r

        # 5. Build queue items
        items = []
        current_index = 0
        found_uncompleted = False

        for i, assignment in enumerate(assignments):
            sub = assignment.get("submissions")
            if not sub:
                continue

            submission_id = sub["id"]
            review = reviews_map.get(submission_id)
            is_completed = assignment["status"] == "completed"

            if not is_completed and not found_uncompleted:
                current_index = len(items)
                found_uncompleted = True

            # Enrich form_data with labels for display
            enriched = _enrich_form_data(
                sub.get("form_data") or {}, form_fields
            )

            items.append({
                "submission": {
                    **sub,
                    "form_data_display": enriched,
                },
                "form_fields": form_fields,
                "review": review,
                "is_completed": is_completed,
            })

        completed = sum(1 for item in items if item["is_completed"])

        # If all completed, set current_index to last
        if not found_uncompleted and items:
            current_index = len(items) - 1

        return {
            "total_assigned": len(items),
            "completed": completed,
            "remaining": len(items) - completed,
            "current_index": current_index,
            "submissions": items,
        }

    async def validate_scores(self, event_id: str, scores: dict[str, float]):
        """
        Validate that all criteria are scored and values are within bounds.
        """
        crit_result = (
            supabase.table("criteria")
            .select("*")
            .eq("event_id", event_id)
            .execute()
        )
        criteria = crit_result.data or []

        if not criteria:
            raise HTTPException(400, "Event has no judging criteria")

        criteria_map = {c["id"]: c for c in criteria}

        for crit_id, score in scores.items():
            if crit_id not in criteria_map:
                raise HTTPException(400, f"Unknown criterion: {crit_id}")
            crit = criteria_map[crit_id]
            if not (crit["scale_min"] <= score <= crit["scale_max"]):
                raise HTTPException(
                    400,
                    f"Score {score} out of range [{crit['scale_min']}-{crit['scale_max']}] "
                    f"for '{crit['name']}'",
                )

        # Ensure ALL criteria are scored
        if set(scores.keys()) != set(criteria_map.keys()):
            missing = set(criteria_map.keys()) - set(scores.keys())
            names = [criteria_map[m]["name"] for m in missing]
            raise HTTPException(400, f"Missing scores for: {', '.join(names)}")

    async def create_or_update_review(
        self, judge_id: str, submission_id: str, scores: dict[str, float],
        notes: str | None,
    ) -> dict:
        """
        Upsert a review. Validates assignment, event status, and scores.
        Marks the assignment as completed.
        """
        # 1. Verify judge is assigned to this submission
        assign_result = (
            supabase.table("judge_assignments")
            .select("*")
            .eq("judge_id", judge_id)
            .eq("submission_id", submission_id)
            .execute()
        )
        if not assign_result.data:
            raise HTTPException(403, "You are not assigned to this submission")

        assignment = assign_result.data[0]
        event_id = assignment["event_id"]

        # 2. Verify event is in judging status
        event_result = (
            supabase.table("events")
            .select("status")
            .eq("id", event_id)
            .single()
            .execute()
        )
        if not event_result.data or event_result.data["status"] != "judging":
            raise HTTPException(400, "Event is not in judging phase")

        # 3. Validate scores against criteria
        await self.validate_scores(event_id, scores)

        # 4. Upsert review
        review_data = {
            "submission_id": submission_id,
            "judge_id": judge_id,
            "event_id": event_id,
            "scores": scores,
            "notes": notes,
        }
        review_result = (
            supabase.table("reviews")
            .upsert(review_data, on_conflict="submission_id,judge_id")
            .execute()
        )
        if not review_result.data:
            raise HTTPException(500, "Failed to save review")

        # 5. Mark assignment as completed
        supabase.table("judge_assignments").update(
            {"status": "completed"}
        ).eq("id", assignment["id"]).execute()

        return review_result.data[0]

    async def get_review(self, review_id: str) -> dict:
        """Get a single review by ID."""
        result = (
            supabase.table("reviews")
            .select("*")
            .eq("id", review_id)
            .single()
            .execute()
        )
        if not result.data:
            raise HTTPException(404, "Review not found")
        return result.data

    async def update_review(
        self, review_id: str, judge_id: str, scores: dict[str, float] | None,
        notes: str | None,
    ) -> dict:
        """Update an existing review. Only the owning judge can update."""
        review = await self.get_review(review_id)
        if review["judge_id"] != judge_id:
            raise HTTPException(403, "Not your review")

        # Verify event is still in judging
        event_result = (
            supabase.table("events")
            .select("status")
            .eq("id", review["event_id"])
            .single()
            .execute()
        )
        if not event_result.data or event_result.data["status"] != "judging":
            raise HTTPException(400, "Event is not in judging phase")

        update_data: dict = {}
        if scores is not None:
            await self.validate_scores(review["event_id"], scores)
            update_data["scores"] = scores
        if notes is not None:
            update_data["notes"] = notes

        if not update_data:
            return review

        result = (
            supabase.table("reviews")
            .update(update_data)
            .eq("id", review_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(500, "Failed to update review")
        return result.data[0]

    async def list_event_reviews(self, event_id: str) -> list[dict]:
        """List all reviews for an event (organizer view)."""
        result = (
            supabase.table("reviews")
            .select("*")
            .eq("event_id", event_id)
            .order("submitted_at")
            .execute()
        )
        return result.data or []


review_service = ReviewService()
