"""
Juryline -- Scoring Service
Compute leaderboards, judge progress, bias detection, and statistics.
"""

from statistics import mean, stdev
from app.supabase_client import supabase
from app.services.submission_service import submission_service


class ScoringService:
    """Service for scoring aggregation and analytics."""

    async def compute_leaderboard(self, event_id: str) -> list[dict]:
        """
        Compute ranked leaderboard with weighted scores.
        Returns sorted list with ranks, criteria breakdowns, and review counts.
        """
        # Fetch criteria with weights
        criteria_result = (
            supabase.table("criteria")
            .select("*")
            .eq("event_id", event_id)
            .order("sort_order")
            .execute()
        )
        criteria = criteria_result.data or []

        if not criteria:
            return []

        # Fetch submissions
        submissions_result = (
            supabase.table("submissions")
            .select("*")
            .eq("event_id", event_id)
            .execute()
        )
        submissions = submissions_result.data or []

        # Fetch all reviews for this event
        reviews_result = (
            supabase.table("reviews")
            .select("*")
            .eq("event_id", event_id)
            .execute()
        )
        reviews = reviews_result.data or []

        # Group reviews by submission
        review_map: dict[str, list] = {}
        for review in reviews:
            sid = review["submission_id"]
            if sid not in review_map:
                review_map[sid] = []
            review_map[sid].append(review)

        # Fetch form fields for project name extraction
        form_fields_result = (
            supabase.table("form_fields")
            .select("*")
            .eq("event_id", event_id)
            .order("sort_order")
            .execute()
        )
        form_fields = form_fields_result.data or []

        # Build leaderboard
        leaderboard = []
        for sub in submissions:
            sub_reviews = review_map.get(sub["id"], [])
            if not sub_reviews:
                continue

            # Extract project name
            display = submission_service.enrich_for_display(
                sub.get("form_data", {}), form_fields
            )
            project_name = next(
                (
                    d["value"]
                    for d in display
                    if d["field_type"] in ("short_text",) and d["value"]
                ),
                f"Submission {sub['id'][:8]}",
            )

            # Compute per-criterion scores
            criteria_scores = {}
            for crit in criteria:
                crit_id = crit["id"]
                scores = [
                    float(r["scores"].get(crit_id, 0))
                    for r in sub_reviews
                    if crit_id in r.get("scores", {})
                ]

                if scores:
                    criteria_scores[crit_id] = {
                        "criterion_name": crit["name"],
                        "average": round(mean(scores), 2),
                        "min_score": min(scores),
                        "max_score": max(scores),
                        "weight": crit.get("weight", 1.0),
                    }

            # Compute weighted total
            total_weight = sum(c.get("weight", 1.0) for c in criteria)
            weighted_score = (
                sum(cs["average"] * cs["weight"] for cs in criteria_scores.values())
                / total_weight
                if total_weight > 0
                else 0
            )

            leaderboard.append({
                "submission_id": sub["id"],
                "project_name": project_name,
                "weighted_score": round(weighted_score, 2),
                "criteria_scores": criteria_scores,
                "review_count": len(sub_reviews),
            })

        # Sort by weighted score descending
        leaderboard.sort(key=lambda x: x["weighted_score"], reverse=True)

        # Assign ranks
        for i, entry in enumerate(leaderboard):
            entry["rank"] = i + 1

        return leaderboard

    async def compute_event_stats(self, event_id: str) -> dict:
        """Compute statistics for event dashboard."""
        # Get counts
        submissions = (
            supabase.table("submissions")
            .select("id", count="exact")
            .eq("event_id", event_id)
            .execute()
        )
        total_submissions = submissions.count or 0

        judges = (
            supabase.table("event_judges")
            .select("id", count="exact")
            .eq("event_id", event_id)
            .execute()
        )
        total_judges = judges.count or 0

        reviews = (
            supabase.table("reviews")
            .select("*")
            .eq("event_id", event_id)
            .execute()
        )
        all_reviews = reviews.data or []
        total_reviews = len(all_reviews)

        # Count assignments
        assignments = (
            supabase.table("judge_assignments")
            .select("*")
            .eq("event_id", event_id)
            .execute()
        )
        all_assignments = assignments.data or []
        total_assignments = len(all_assignments)
        completed_assignments = sum(
            1 for a in all_assignments if a.get("status") == "completed"
        )

        completion_percent = (
            round((completed_assignments / total_assignments) * 100, 1)
            if total_assignments > 0
            else 0
        )

        # Compute average score
        all_scores = []
        for review in all_reviews:
            scores_dict = review.get("scores", {})
            all_scores.extend([float(s) for s in scores_dict.values()])

        avg_score = round(mean(all_scores), 2) if all_scores else None

        return {
            "total_submissions": total_submissions,
            "total_judges": total_judges,
            "total_reviews": total_reviews,
            "reviews_completed": completed_assignments,
            "reviews_pending": total_assignments - completed_assignments,
            "completion_percent": completion_percent,
            "avg_score": avg_score,
        }

    async def compute_judge_progress(self, event_id: str) -> list[dict]:
        """Compute per-judge progress statistics."""
        # Get all judges for event
        judges_result = (
            supabase.table("event_judges")
            .select("judge_id, profiles:judge_id(id, name)")
            .eq("event_id", event_id)
            .execute()
        )
        judges_data = judges_result.data or []

        # Get all assignments
        assignments_result = (
            supabase.table("judge_assignments")
            .select("*")
            .eq("event_id", event_id)
            .execute()
        )
        assignments = assignments_result.data or []

        # Build per-judge stats
        judge_map: dict[str, dict] = {}
        for judge_entry in judges_data:
            jid = judge_entry["judge_id"]
            profile = judge_entry.get("profiles") or {}
            judge_map[jid] = {
                "judge_id": jid,
                "judge_name": profile.get("name", "Unknown"),
                "assigned": 0,
                "completed": 0,
            }

        for assignment in assignments:
            jid = assignment["judge_id"]
            if jid not in judge_map:
                judge_map[jid] = {
                    "judge_id": jid,
                    "judge_name": "Unknown",
                    "assigned": 0,
                    "completed": 0,
                }
            judge_map[jid]["assigned"] += 1
            if assignment.get("status") == "completed":
                judge_map[jid]["completed"] += 1

        # Compute percentages and status
        progress_list = []
        for stats in judge_map.values():
            assigned = stats["assigned"]
            completed = stats["completed"]
            percent = round((completed / assigned) * 100, 1) if assigned > 0 else 0

            if percent == 100:
                status = "completed"
            elif percent > 0:
                status = "in_progress"
            else:
                status = "not_started"

            progress_list.append({
                "judge_id": stats["judge_id"],
                "judge_name": stats["judge_name"],
                "assigned": assigned,
                "completed": completed,
                "percent": percent,
                "status": status,
            })

        # Sort by completion percent descending
        progress_list.sort(key=lambda x: x["percent"], reverse=True)

        return progress_list

    async def compute_bias_report(self, event_id: str) -> list[dict]:
        """
        Detect judge bias by comparing average scores given vs event average.
        Flags outliers (> 1.5 standard deviations from mean).
        """
        # Get all reviews
        reviews_result = (
            supabase.table("reviews")
            .select("*")
            .eq("event_id", event_id)
            .execute()
        )
        reviews = reviews_result.data or []

        if not reviews:
            return []

        # Get judge names
        judges_result = (
            supabase.table("event_judges")
            .select("judge_id, profiles:judge_id(name)")
            .eq("event_id", event_id)
            .execute()
        )
        judge_name_map = {}
        for j in judges_result.data or []:
            profile = j.get("profiles") or {}
            judge_name_map[j["judge_id"]] = profile.get("name", "Unknown")

        # Compute per-judge average scores
        judge_scores: dict[str, list[float]] = {}
        all_scores: list[float] = []

        for review in reviews:
            jid = review["judge_id"]
            scores_dict = review.get("scores", {})
            scores = [float(s) for s in scores_dict.values()]

            if jid not in judge_scores:
                judge_scores[jid] = []
            judge_scores[jid].extend(scores)
            all_scores.extend(scores)

        if not all_scores:
            return []

        event_avg = mean(all_scores)
        event_std = stdev(all_scores) if len(all_scores) > 1 else 0

        # Build bias report
        bias_report = []
        for jid, scores in judge_scores.items():
            judge_avg = mean(scores)
            deviation = judge_avg - event_avg
            is_outlier = abs(deviation) > (1.5 * event_std) if event_std > 0 else False

            bias_report.append({
                "judge_id": jid,
                "judge_name": judge_name_map.get(jid, "Unknown"),
                "avg_score_given": round(judge_avg, 2),
                "event_avg": round(event_avg, 2),
                "deviation": round(deviation, 2),
                "is_outlier": is_outlier,
            })

        # Sort by absolute deviation descending
        bias_report.sort(key=lambda x: abs(x["deviation"]), reverse=True)

        return bias_report

    async def get_full_dashboard(self, event_id: str) -> dict:
        """Get complete dashboard data in one call."""
        # Get event details
        event_result = supabase.table("events").select("*").eq("id", event_id).single().execute()
        event = event_result.data

        # Compute all dashboard data
        stats = await self.compute_event_stats(event_id)
        judge_progress = await self.compute_judge_progress(event_id)
        leaderboard = await self.compute_leaderboard(event_id)

        return {
            "event": event,
            "stats": stats,
            "judge_progress": judge_progress,
            "leaderboard": leaderboard,
        }


scoring_service = ScoringService()
