# Phase 06 — Archestra Integration (Workflow Orchestration)

## Goal
Set up Archestra.ai as the workflow orchestration layer. Create 5 agents via Archestra's platform and integrate with FastAPI backend via the A2A (Agent-to-Agent) JSON-RPC 2.0 protocol.

---

## Architecture

```
FastAPI Backend ──(A2A JSON-RPC 2.0)──▶ Archestra Platform (Docker)
                                           │
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                           Agent 1     Agent 2      Agent 3
                          (Ingest)    (Assign)    (Progress)
                              Agent 4      Agent 5
                            (Aggregate)  (Feedback)
```

- Archestra runs as Docker container on port 9000
- Agents created via Archestra UI (no-code)
- FastAPI calls agents via `POST /v1/a2a/<promptId>` with Bearer token
- Agent responses parsed as JSON

---

## Step 1: Archestra Setup

### 1.1 Docker (already in compose from Phase 01)
```bash
docker pull archestra/platform:latest
# Runs on localhost:9000 (API) and localhost:3001 (UI)
```

### 1.2 Configure LLM + API Key
1. `http://localhost:3001` → Settings → LLM API Keys → Add provider
2. Profile → API Keys → Generate token → save as `ARCHESTRA_API_KEY`

---

## Step 2: Create 5 Agents (Archestra UI)

Create each agent in Archestra UI → Agents page. Save each `promptId` to `.env`.

### Agent 1: Submission Ingestion

**System Prompt:**
```
You are the Submission Ingestion Agent for Juryline.

When you receive a submission JSON, validate it:
1. project_name must be non-empty
2. demo_url and repo_url must be valid HTTP/HTTPS URLs if provided
3. Flag missing links, placeholder text, or suspicious content
4. Normalize whitespace

Respond ONLY with valid JSON:
{
  "valid": true/false,
  "warnings": ["list"],
  "errors": ["list"],
  "normalized": { "project_name": "cleaned value", ... }
}
```

### Agent 2: Judge Assignment

**System Prompt:**
```
You are the Judge Assignment Agent for Juryline.

Input JSON:
{
  "judges": [{"id": "...", "name": "...", "current_load": N}],
  "submissions": [{"id": "...", "project_name": "..."}],
  "judges_per_submission": N
}

Assign exactly judges_per_submission judges to each submission using balanced round-robin.
No judge should be overloaded. No duplicate assignments.

Respond ONLY with valid JSON:
{
  "assignments": [{"submission_id": "...", "judge_id": "..."}, ...],
  "judge_loads": {"judge_id": count, ...},
  "strategy": "balanced_round_robin"
}
```

### Agent 3: Review Progress Orchestrator

**System Prompt:**
```
You are the Review Progress Orchestrator for Juryline.

Input JSON with assignments and their statuses. Calculate:
1. Overall progress percentage
2. Per-judge progress (completed/assigned, status: on_track/behind/not_started)
3. Pending submissions needing reviews
4. Whether all reviews are complete
5. Reminder messages for behind judges

Respond ONLY with valid JSON:
{
  "progress_percent": 75,
  "completed_reviews": N,
  "total_reviews": N,
  "judges_status": [...],
  "pending_submissions": [...],
  "all_complete": false,
  "reminders": [...]
}
```

### Agent 4: Score Aggregation

**System Prompt:**
```
You are the Score Aggregation Agent for Juryline.

Input: criteria with weights, submissions with judge reviews/scores.

Tasks:
1. Per-criterion average across judges
2. Weighted total = sum(avg * weight) / sum(weights)
3. Rank by weighted total (descending)
4. Flag outliers: judge score deviates > 2 points from criterion mean

Respond ONLY with valid JSON:
{
  "leaderboard": [{"rank": 1, "submission_id": "...", "project_name": "...", "total_score": 8.5, "criteria_averages": {...}, "review_count": N}, ...],
  "outliers": [{"judge_id": "...", "submission_id": "...", "criterion_id": "...", "judge_score": 2, "mean_score": 8}],
  "statistics": {"avg_total": 7.2, "highest": 9.1, "lowest": 4.3}
}
```

### Agent 5: Feedback Summary (AI-Powered)

**System Prompt:**
```
You are the Feedback Summary Agent for Juryline.

Synthesize judge notes into constructive feedback for a team. Do NOT identify individual judges.

Input: submission details + all reviews with notes/scores + criteria names.

Respond ONLY with valid JSON:
{
  "summary": "Overall feedback paragraph (3-5 sentences)...",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "overall_sentiment": "positive|mixed|needs_work"
}
```

---

## Step 3: Backend A2A Client

### 3.1 Archestra Service (`app/services/archestra_service.py`)

```python
class ArchestraService:
    def __init__(self, settings):
        self.base_url = settings.ARCHESTRA_BASE_URL
        self.api_key = settings.ARCHESTRA_API_KEY
        self.prompt_ids = {
            "ingest": settings.ARCHESTRA_INGEST_PROMPT_ID,
            "assign": settings.ARCHESTRA_ASSIGN_PROMPT_ID,
            "progress": settings.ARCHESTRA_PROGRESS_PROMPT_ID,
            "aggregate": settings.ARCHESTRA_AGGREGATE_PROMPT_ID,
            "feedback": settings.ARCHESTRA_FEEDBACK_PROMPT_ID,
        }

    async def _call_agent(self, agent_name: str, payload: dict) -> dict:
        prompt_id = self.prompt_ids[agent_name]
        body = {
            "jsonrpc": "2.0",
            "id": str(uuid4()),
            "method": "message/send",
            "params": {
                "message": {
                    "parts": [{"kind": "text", "text": json.dumps(payload)}]
                }
            }
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/v1/a2a/{prompt_id}",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json=body,
                timeout=60.0
            )
            resp.raise_for_status()
            result = resp.json()
            agent_text = result["result"]["parts"][0]["text"]
            return json.loads(agent_text)

    async def validate_submission(self, data: dict) -> dict:
        return await self._call_agent("ingest", data)

    async def assign_judges(self, data: dict) -> dict:
        return await self._call_agent("assign", data)

    async def get_progress(self, data: dict) -> dict:
        return await self._call_agent("progress", data)

    async def aggregate_scores(self, data: dict) -> dict:
        return await self._call_agent("aggregate", data)

    async def generate_feedback(self, data: dict) -> dict:
        return await self._call_agent("feedback", data)
```

### 3.2 Archestra Router (`app/routers/archestra.py`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/archestra/ingest-submission` | POST | Organizer | Validate a submission |
| `/api/v1/archestra/assign-judges/{event_id}` | POST | Organizer | Trigger judge assignment |
| `/api/v1/archestra/progress/{event_id}` | GET | Organizer | Get judging progress |
| `/api/v1/archestra/aggregate/{event_id}` | POST | Organizer | Aggregate scores |
| `/api/v1/archestra/feedback/{submission_id}` | POST | Organizer | Generate feedback |
| `/api/v1/archestra/status` | GET | Any | Archestra health check |

### 3.3 Integration Points

```python
# On event → "judging" transition:
# 1. Get all judges + submissions from Supabase
# 2. Call archestra.assign_judges({ judges, submissions, judges_per_submission })
# 3. Save assignments to Supabase judge_assignments table

# On organizer dashboard refresh:
# 1. Get assignments from Supabase
# 2. Call archestra.get_progress({ assignments })
# 3. Return progress data to frontend

# On "close event" or on-demand:
# 1. Get all reviews + criteria from Supabase
# 2. Call archestra.aggregate_scores({ criteria, submissions_with_reviews })
# 3. Display leaderboard
```

---

## Step 4: Deterministic Fallbacks

When Archestra is offline or returns invalid responses:

```python
class FallbackService:
    def assign_judges_round_robin(self, judges, submissions, n_per_sub):
        assignments = []
        judge_idx = 0
        for sub in submissions:
            for _ in range(n_per_sub):
                assignments.append({
                    "submission_id": sub["id"],
                    "judge_id": judges[judge_idx % len(judges)]["id"]
                })
                judge_idx += 1
        return {"assignments": assignments}
    
    def aggregate_scores(self, criteria, submissions_reviews):
        # Standard weighted average computation
        # Pure Python — no LLM needed
```

The `ArchestraService` tries Archestra first, falls back on timeout/error.

---

## Verification Checklist

- [ ] Archestra Docker container runs on port 9000
- [ ] All 5 agents created with correct prompts + promptIds saved
- [ ] API key configured in `.env`
- [ ] `_call_agent()` sends valid JSON-RPC 2.0 and parses response
- [ ] Submission ingestion validates sample data
- [ ] Judge assignment distributes evenly
- [ ] Score aggregation computes correct weighted totals
- [ ] Feedback summary produces coherent output
- [ ] Fallback service works when Archestra is offline
- [ ] Archestra health check endpoint responds
