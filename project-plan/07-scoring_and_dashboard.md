# Phase 07 — Scoring, Leaderboard & Organizer Dashboard

## Goal
Build scoring aggregation, interactive leaderboard, and comprehensive organizer dashboard with animated visualizations — all reading from Supabase.

---

## Step 1: Backend — Scoring & Dashboard API

### 1.1 Dashboard Models

```python
class DashboardResponse(BaseModel):
    event: EventResponse
    stats: EventStats
    judge_progress: list[JudgeProgress]
    leaderboard: list[LeaderboardEntry]

class EventStats(BaseModel):
    total_submissions: int
    total_judges: int
    total_reviews: int
    reviews_completed: int
    reviews_pending: int
    completion_percent: float
    avg_score: Optional[float]

class JudgeProgress(BaseModel):
    judge_id: str
    judge_name: str
    assigned: int
    completed: int
    percent: float
    status: str  # "completed" | "in_progress" | "not_started"

class LeaderboardEntry(BaseModel):
    rank: int
    submission_id: str
    project_name: str
    team_name: Optional[str]
    total_score: float
    weighted_score: float
    criteria_scores: dict[str, CriterionScore]
    review_count: int

class CriterionScore(BaseModel):
    criterion_name: str
    average: float
    min_score: float
    max_score: float
    weight: float

class BiasReport(BaseModel):
    judge_id: str
    judge_name: str
    avg_score_given: float
    event_avg: float
    deviation: float
    is_outlier: bool
```

### 1.2 Dashboard Router

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/events/{id}/dashboard` | GET | Organizer | Full dashboard data |
| `/api/v1/events/{id}/leaderboard` | GET | Organizer | Leaderboard only |
| `/api/v1/events/{id}/export` | GET | Organizer | Export CSV |
| `/api/v1/events/{id}/judge-progress` | GET | Organizer | Judge progress |
| `/api/v1/events/{id}/bias-report` | GET | Organizer | Bias analysis |

### 1.3 Scoring Logic (deterministic — always computed in Python)

```python
class ScoringService:
    async def compute_leaderboard(self, event_id: str):
        # 1. Fetch criteria with weights
        criteria = supabase.table("criteria").select("*").eq("event_id", event_id).execute()
        
        # 2. Fetch all submissions + reviews for event
        submissions = supabase.table("submissions") \
            .select("*, reviews(*)") \
            .eq("event_id", event_id).execute()
        
        # 3. For each submission:
        leaderboard = []
        for sub in submissions.data:
            if not sub["reviews"]:
                continue
            
            criteria_scores = {}
            for crit in criteria.data:
                scores = [r["scores"].get(crit["id"], 0) for r in sub["reviews"]]
                criteria_scores[crit["id"]] = {
                    "criterion_name": crit["name"],
                    "average": sum(scores) / len(scores),
                    "min_score": min(scores),
                    "max_score": max(scores),
                    "weight": crit["weight"] or 1.0,
                }
            
            # Weighted total
            total_weight = sum(c["weight"] or 1.0 for c in criteria.data)
            weighted = sum(
                cs["average"] * cs["weight"]
                for cs in criteria_scores.values()
            ) / total_weight
            
            leaderboard.append({
                "submission_id": sub["id"],
                "project_name": sub["project_name"],
                "team_name": sub["team_name"],
                "weighted_score": round(weighted, 2),
                "criteria_scores": criteria_scores,
                "review_count": len(sub["reviews"]),
            })
        
        # 4. Sort + assign ranks (handle ties)
        leaderboard.sort(key=lambda x: x["weighted_score"], reverse=True)
        for i, entry in enumerate(leaderboard):
            entry["rank"] = i + 1
        
        return leaderboard

    async def compute_bias(self, event_id: str):
        # Compare each judge's average score to overall event average
        # Flag if deviation > 1.5 standard deviations
```

### 1.4 CSV Export

```python
@router.get("/events/{event_id}/export")
async def export_csv(event_id: str, user = Depends(require_organizer)):
    leaderboard = await scoring_service.compute_leaderboard(event_id)
    criteria = supabase.table("criteria").select("*").eq("event_id", event_id).execute()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    header = ["Rank", "Project", "Team", "Weighted Score"]
    header += [c["name"] + " (avg)" for c in criteria.data]
    header += ["Reviews"]
    writer.writerow(header)
    
    # Rows
    for entry in leaderboard:
        row = [entry["rank"], entry["project_name"], entry["team_name"], entry["weighted_score"]]
        row += [entry["criteria_scores"].get(c["id"], {}).get("average", "") for c in criteria.data]
        row += [entry["review_count"]]
        writer.writerow(row)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=results_{event_id}.csv"}
    )
```

---

## Step 2: Frontend — Organizer Dashboard

### 2.1 Dashboard Layout

```
┌──────────────────────────────────────────────────────┐
│  AI Hackathon 2025                   Status: Judging │
│  Jan 15 - Jan 18, 2025                               │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐     │
│  │   12   │  │    4   │  │   36   │  │  75%   │     │
│  │  Subs  │  │ Judges │  │Reviews │  │  Done  │     │
│  └────────┘  └────────┘  └────────┘  └────────┘     │
│                                                       │
│  ── Judge Progress ────────────────────────────       │
│  Alice    ████████████░░░  8/12  67%  ✓              │
│  Bob      ██████████████░ 11/12  92%  ✓              │
│  Charlie  ████████░░░░░░░  6/12  50%  ⚠              │
│  Diana    ████████████████ 12/12 100% ★              │
│                                                       │
│  ── Leaderboard ──────────────────────────────       │
│  🥇 AI Recipe Gen    8.5  [████████░░]               │
│  🥈 CodeBuddy        7.8  [███████░░░]               │
│  🥉 EcoTracker       7.2  [███████░░░]               │
│     DataViz Pro      6.4  [██████░░░░]               │
│                                                       │
│  [📊 Export CSV]  [🤖 Archestra Refresh]  [⚠ Bias]   │
└──────────────────────────────────────────────────────┘
```

### 2.2 Dashboard Components

#### `StatCard` — Animated counter cards
- Counts from 0 to value on page load (Framer Motion)
- Icon + label + large number
- Subtle gradient border, glassmorphism effect
- Hover: slight elevation + shadow increase

#### `JudgeProgressList` — Per-judge progress
- Avatar initial + name + animated progress bar
- Fraction: "8/12" + percentage
- Status icons: ★ (complete), ✓ (on track), ⚠ (behind)
- Staggered slide-in animation

#### `LeaderboardTable` — Ranked submissions
- Medal icons for top 3 position (🥇🥈🥉)
- Expandable rows → per-criterion breakdown with mini bar charts
- Score visualization bars (Chakra `Progress` with brand gradient)
- Hover row highlight
- Animated entrance: rows slide in from bottom

#### `BiasDetector` — Modal/section for bias analysis
- Per-judge scoring distribution
- Outlier judges highlighted in red
- Explanation tooltip
- Accessed via "Bias Report" button

### 2.3 Archestra-Powered Refresh

- "Archestra Refresh" button → `POST /archestra/aggregate/{event_id}`
- Loading overlay with animated dots
- Leaderboard re-renders with fresh data
- Toast: "Scores aggregated via Archestra ✨"

### 2.4 Animated Data Visualizations

```typescript
// AnimatedCounter: useMotionValue to count from 0
// ScoreBar: progress bar animating width from 0% to score%
// ProgressRing: circular SVG with animating stroke-dasharray
```

---

## Verification Checklist

- [ ] Dashboard returns correct stats, progress, and leaderboard
- [ ] Leaderboard ranks by weighted total score correctly
- [ ] Ties in ranking handled properly
- [ ] Bias detection flags judges with significant deviation
- [ ] CSV export downloads valid file with all data
- [ ] Stat cards animate counter on page load
- [ ] Progress bars animate on render
- [ ] Leaderboard rows expandable with criteria breakdown
- [ ] "Archestra Refresh" triggers aggregation and updates UI
- [ ] All animations run at 60fps
