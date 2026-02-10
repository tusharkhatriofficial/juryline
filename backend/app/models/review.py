"""
Juryline — Review Models
"""

from pydantic import BaseModel, Field
from typing import Optional


class ReviewCreate(BaseModel):
    submission_id: str
    scores: dict[str, float]  # { criterion_id: score_value }
    notes: Optional[str] = Field(None, max_length=5000)


class ReviewUpdate(BaseModel):
    scores: Optional[dict[str, float]] = None
    notes: Optional[str] = Field(None, max_length=5000)


class ReviewResponse(BaseModel):
    id: str
    submission_id: str
    judge_id: str
    event_id: str
    scores: dict
    notes: Optional[str] = None
    submitted_at: str
    updated_at: str


class JudgeQueueResponse(BaseModel):
    total_assigned: int
    completed: int
    remaining: int
    current_index: int
    submissions: list[dict]  # SubmissionWithReviewStatus items


class CriterionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    scale_min: int = Field(default=0, ge=0)
    scale_max: int = Field(default=10, ge=1, le=100)
    weight: float = Field(default=1.0, gt=0)


class CriterionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    scale_min: Optional[int] = Field(None, ge=0)
    scale_max: Optional[int] = Field(None, ge=1, le=100)
    weight: Optional[float] = Field(None, gt=0)


class CriterionResponse(BaseModel):
    id: str
    event_id: str
    name: str
    scale_min: int
    scale_max: int
    weight: float
    sort_order: int
    created_at: str
