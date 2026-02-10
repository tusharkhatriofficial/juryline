"""
Juryline — Form Field Models (Google Forms-style dynamic fields)
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal, Union


FIELD_TYPES = Literal[
    "short_text",
    "long_text",
    "number",
    "url",
    "email",
    "dropdown",
    "multiple_choice",
    "checkboxes",
    "file_upload",
    "date",
    "linear_scale",
]


class FormFieldCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=255)
    field_type: FIELD_TYPES
    description: Optional[str] = Field(None, max_length=1000)
    is_required: bool = False
    options: Optional[Union[dict, list]] = None
    validation: Optional[dict] = None


class FormFieldUpdate(BaseModel):
    label: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    is_required: Optional[bool] = None
    options: Optional[Union[dict, list]] = None
    validation: Optional[dict] = None


class FieldOrderItem(BaseModel):
    id: str
    sort_order: int


class FormFieldReorder(BaseModel):
    """Batch reorder: list of { id, sort_order }."""
    order: list[FieldOrderItem]


class FormFieldResponse(BaseModel):
    id: str
    event_id: str
    label: str
    field_type: str
    description: Optional[str] = None
    is_required: bool
    options: Optional[Union[dict, list]] = None
    validation: Optional[dict] = None
    sort_order: int
    created_at: str
