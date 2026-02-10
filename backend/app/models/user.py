"""
Juryline — User / Profile Models
"""

from pydantic import BaseModel, Field
from typing import Optional


class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    role: str
    avatar_url: Optional[str] = None
    created_at: str
    updated_at: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    avatar_url: Optional[str] = None


class SignUpRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(default="participant")


class SignInRequest(BaseModel):
    email: str
    password: str
