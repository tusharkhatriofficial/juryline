"""
Juryline — Submission Models (dynamic form_data)
"""

from pydantic import BaseModel
from typing import Optional


class SubmissionCreate(BaseModel):
    form_data: dict  # { field_id: value } — dynamic, matches form_fields


class SubmissionUpdate(BaseModel):
    form_data: dict


class SubmissionResponse(BaseModel):
    id: str
    event_id: str
    participant_id: str
    form_data: dict
    form_data_display: Optional[list] = None  # Enriched with labels for display
    status: str
    created_at: str
    updated_at: str
