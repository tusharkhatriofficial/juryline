"""
Juryline — Event Models
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class EventCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    banner_url: Optional[str] = None
    start_at: datetime
    end_at: datetime
    judges_per_submission: int = Field(default=2, ge=1, le=10)


class EventUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    banner_url: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    judges_per_submission: Optional[int] = Field(None, ge=1, le=10)


class EventStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(draft|open|judging|closed)$")


class EventResponse(BaseModel):
    id: str
    organizer_id: str
    name: str
    description: Optional[str] = None
    banner_url: Optional[str] = None
    start_at: str
    end_at: str
    status: str
    judges_per_submission: int
    created_at: str
    updated_at: str

    # Computed counts (populated by service)
    submission_count: int = 0
    judge_count: int = 0
    form_field_count: int = 0
    criteria_count: int = 0
