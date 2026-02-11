"""
Juryline -- Fallback Service
Deterministic implementations of judge assignment, progress tracking,
and score aggregation. Used when Archestra is offline or unconfigured.
"""

from statistics import mean


class FallbackService:
    """Pure Python fallbacks — no LLM, always works."""

    def assign_judges_round_robin(
        self,
        judges: list[dict],
        submissions: list[dict],
        judges_per_submission: int,
    ) -> dict:
        """
        Balanced round-robin assignment. Each submission gets exactly
        judges_per_submission judges. Distributes load evenly.
        """
        if not judges:
            return {"assignments": [], "judge_loads": {}, "strategy": "round_robin"}
        if not submissions:
            return {"assignments": [], "judge_loads": {}, "strategy": "round_robin"}

        assignments = []
        judge_loads: dict[str, int] = {j["id"]: 0 for j in judges}
        judge_idx = 0
        n_judges = len(judges)

        for sub in submissions:
            assigned_to_sub: set[str] = set()
            count = min(judges_per_submission, n_judges)

            for _ in range(count):
                # Find next judge not already assigned to this submission
                attempts = 0
                while judges[judge_idx % n_judges]["id"] in assigned_to_sub and attempts < n_judges:
                    judge_idx += 1
                    attempts += 1

                jid = judges[judge_idx % n_judges]["id"]
                assigned_to_sub.add(jid)
                assignments.append({
                    "submission_id": sub["id"],
                    "judge_id": jid,
                })
                judge_loads[jid] = judge_loads.get(jid, 0) + 1
                judge_idx += 1

        return {
            "assignments": assignments,
            "judge_loads": judge_loads,
            "strategy": "balanced_round_robin",
        }

    def compute_progress(self, assignments: list[dict]) -> dict:
        """
        Compute review progress from assignment statuses.
        """
        total = len(assignments)
        completed = sum(1 for a in assignments if a.get("status") == "completed")

        # Per-judge stats
        judge_map: dict[str, dict] = {}
        for a in assignments:
            jid = a.get("judge_id", "")
            if jid not in judge_map:
                judge_map[jid] = {"assigned": 0, "completed": 0, "judge_id": jid}
            judge_map[jid]["assigned"] += 1
            if a.get("status") == "completed":
                judge_map[jid]["completed"] += 1

        judges_status = []
        reminders = []
        for jid, info in judge_map.items():
            pct = info["completed"] / info["assigned"] if info["assigned"] else 0
            if pct >= 1.0:
                status = "done"
            elif pct > 0:
                status = "on_track"
            else:
                status = "not_started"

            judges_status.append({
                "judge_id": jid,
                "assigned": info["assigned"],
                "completed": info["completed"],
                "status": status,
            })

            if status == "not_started":
                reminders.append(f"Judge {jid} has not started reviewing yet.")
            elif pct < 0.5 and info["assigned"] > 0:
                reminders.append(
                    f"Judge {jid} has completed {info['completed']}/{info['assigned']} reviews."
                )

        # Pending submissions
        sub_review_counts: dict[str, int] = {}
        for a in assignments:
            sid = a.get("submission_id", "")
            if a.get("status") != "completed":
                sub_review_counts[sid] = sub_review_counts.get(sid, 0) + 1

        pending_submissions = [
            {"submission_id": sid, "remaining_reviews": cnt}
            for sid, cnt in sub_review_counts.items()
        ]

        return {
            "progress_percent": round((completed / total * 100) if total else 0, 1),
            "completed_reviews": completed,
            "total_reviews": total,
            "judges_status": judges_status,
            "pending_submissions": pending_submissions,
            "all_complete": completed >= total,
            "reminders": reminders,
        }

    def aggregate_scores(
        self,
        criteria: list[dict],
        submissions_with_reviews: list[dict],
    ) -> dict:
        """
        Weighted average score aggregation.
        submissions_with_reviews: [{id, project_name, reviews: [{scores: {crit_id: val}, ...}]}]
        """
        weight_sum = sum(c.get("weight", 1.0) for c in criteria)
        crit_map = {c["id"]: c for c in criteria}

        leaderboard = []
        all_totals = []
        outliers = []

        for sub in submissions_with_reviews:
            reviews = sub.get("reviews", [])
            if not reviews:
                continue

            # Per-criterion averages
            crit_averages: dict[str, float] = {}
            crit_all_scores: dict[str, list[float]] = {}
            for crit in criteria:
                scores_for_crit = []
                for rev in reviews:
                    s = rev.get("scores", {}).get(crit["id"])
                    if s is not None:
                        scores_for_crit.append(float(s))
                if scores_for_crit:
                    crit_averages[crit["id"]] = round(mean(scores_for_crit), 2)
                    crit_all_scores[crit["id"]] = scores_for_crit

            # Weighted total
            weighted_total = 0.0
            for crit in criteria:
                avg = crit_averages.get(crit["id"], 0)
                w = crit.get("weight", 1.0)
                weighted_total += avg * w
            total_score = round(weighted_total / weight_sum, 2) if weight_sum else 0

            leaderboard.append({
                "submission_id": sub["id"],
                "project_name": sub.get("project_name", "Unknown"),
                "total_score": total_score,
                "criteria_averages": crit_averages,
                "review_count": len(reviews),
            })
            all_totals.append(total_score)

            # Outlier detection (|score - mean| > 2)
            for crit_id, scores_list in crit_all_scores.items():
                if len(scores_list) < 2:
                    continue
                avg = mean(scores_list)
                for rev in reviews:
                    s = rev.get("scores", {}).get(crit_id)
                    if s is not None and abs(float(s) - avg) > 2:
                        outliers.append({
                            "judge_id": rev.get("judge_id", ""),
                            "submission_id": sub["id"],
                            "criterion_id": crit_id,
                            "judge_score": float(s),
                            "mean_score": round(avg, 2),
                        })

        # Sort by total_score descending, assign ranks
        leaderboard.sort(key=lambda x: x["total_score"], reverse=True)
        for i, entry in enumerate(leaderboard):
            entry["rank"] = i + 1

        stats = {
            "avg_total": round(mean(all_totals), 2) if all_totals else 0,
            "highest": max(all_totals) if all_totals else 0,
            "lowest": min(all_totals) if all_totals else 0,
        }

        return {
            "leaderboard": leaderboard,
            "outliers": outliers,
            "statistics": stats,
        }


fallback_service = FallbackService()
