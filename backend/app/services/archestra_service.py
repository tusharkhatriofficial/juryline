"""
Juryline -- Archestra A2A Client
Calls Archestra agents via JSON-RPC 2.0 protocol.
Falls back to deterministic FallbackService when Archestra is offline/unconfigured.
"""

import re
import json
import logging
from uuid import uuid4

import httpx

from app.config import get_settings
from app.services.fallback_service import fallback_service

logger = logging.getLogger(__name__)


class ArchestraService:
    """A2A client for Archestra agent orchestration with automatic fallback."""

    def __init__(self):
        settings = get_settings()
        self.base_url = settings.archestra_base_url.rstrip("/") if settings.archestra_base_url else ""
        self.api_key = settings.archestra_api_key
        self.prompt_ids = {
            "ingest": settings.archestra_ingest_prompt_id,
            "assign": settings.archestra_assign_prompt_id,
            "progress": settings.archestra_progress_prompt_id,
            "aggregate": settings.archestra_aggregate_prompt_id,
            "feedback": settings.archestra_feedback_prompt_id,
        }

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self.api_key)

    def _clean_json_text(self, text: str) -> str:
        """Clean agent response text to extract valid JSON."""
        # 1. Remove <think>...</think> blocks (common in reasoning models)
        text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
        
        # 2. Extract JSON object from markdown code blocks or raw text
        # Find the first '{' and the last '}'
        start = text.find("{")
        end = text.rfind("}")
        
        if start != -1 and end != -1:
            return text[start : end + 1]
        return text

    async def _call_agent(self, agent_name: str, payload: dict) -> dict | None:
        """
        Call an Archestra agent via A2A JSON-RPC 2.0.
        Returns parsed JSON response or None on failure.
        """
        if not self.is_configured:
            logger.info("Archestra not configured, using fallback for %s", agent_name)
            return None

        prompt_id = self.prompt_ids.get(agent_name)
        if not prompt_id:
            logger.warning("No prompt ID for agent '%s', using fallback", agent_name)
            return None

        body = {
            "jsonrpc": "2.0",
            "id": str(uuid4()),
            "method": "message/send",
            "params": {
                "message": {
                    "parts": [{"kind": "text", "text": json.dumps(payload)}]
                }
            },
        }

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{self.base_url}/v1/a2a/{prompt_id}",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=body,
                    timeout=60.0,
                )
                resp.raise_for_status()
                result = resp.json()
                agent_text = result["result"]["parts"][0]["text"]
                
                cleaned_text = self._clean_json_text(agent_text)
                return json.loads(cleaned_text)
        except Exception as e:
            logger.warning("Archestra agent '%s' call failed: %s. Using fallback.", agent_name, e)
            return None

    async def validate_submission(self, form_data: dict) -> dict:
        """Validate a submission via the Ingest agent, or pass-through."""
        result = await self._call_agent("ingest", form_data)
        if result:
            return result
        # Fallback: no validation, just pass through
        return {"valid": True, "warnings": [], "errors": [], "normalized": form_data}

    async def assign_judges(
        self,
        judges: list[dict],
        submissions: list[dict],
        judges_per_submission: int,
    ) -> dict:
        """Assign judges via the Assignment agent, or deterministic round-robin."""
        result = await self._call_agent("assign", {
            "judges": judges,
            "submissions": submissions,
            "judges_per_submission": judges_per_submission,
        })
        if result and "assignments" in result:
            # If AI returns 0 assignments but we have data, likely a failure/refusal
            if not result["assignments"] and submissions and judges:
                logger.warning("Archestra returned 0 assignments. Falling back.")
            else:
                return result
        # Fallback
        logger.info("Using fallback round-robin judge assignment")
        return fallback_service.assign_judges_round_robin(
            judges, submissions, judges_per_submission
        )

    async def get_progress(self, assignments: list[dict]) -> dict:
        """Get review progress via Progress agent, or compute locally."""
        result = await self._call_agent("progress", {"assignments": assignments})
        if result and "progress_percent" in result:
            return result
        return fallback_service.compute_progress(assignments)

    async def aggregate_scores(
        self,
        criteria: list[dict],
        submissions_with_reviews: list[dict],
    ) -> dict:
        """Aggregate scores via Aggregation agent, or compute locally."""
        result = await self._call_agent("aggregate", {
            "criteria": criteria,
            "submissions_with_reviews": submissions_with_reviews,
        })
        if result and "leaderboard" in result:
            return result
        return fallback_service.aggregate_scores(criteria, submissions_with_reviews)

    async def generate_feedback(
        self,
        submission: dict,
        reviews: list[dict],
        criteria: list[dict],
    ) -> dict:
        """Generate AI feedback summary. No fallback (requires LLM)."""
        result = await self._call_agent("feedback", {
            "submission": submission,
            "reviews": reviews,
            "criteria": criteria,
        })
        if result:
            return result
        return {
            "summary": "Feedback generation requires Archestra to be configured.",
            "strengths": [],
            "improvements": [],
            "overall_sentiment": "mixed",
        }

    async def health_check(self) -> dict:
        """Check if Archestra platform is reachable."""
        if not self.is_configured:
            return {"status": "not_configured", "message": "Archestra env vars not set. Using fallbacks."}
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{self.base_url}/health", timeout=5.0)
                if resp.status_code == 200:
                    return {"status": "healthy", "url": self.base_url}
                return {"status": "unhealthy", "code": resp.status_code}
        except Exception as e:
            return {"status": "unreachable", "error": str(e)}


archestra_service = ArchestraService()
