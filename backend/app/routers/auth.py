"""
Juryline -- Auth Router
Handles signup, login, profile fetch, and logout via Supabase Auth.
"""

from fastapi import APIRouter, HTTPException, Depends
from app.supabase_client import supabase
from app.utils.dependencies import get_current_user
from app.models.user import SignUpRequest, SignInRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
async def signup(request: SignUpRequest):
    """
    Register a new user via Supabase Auth.
    Sends a verification email. Profile is auto-created by DB trigger.
    """
    try:
        result = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "name": request.name,
                    "role": request.role,
                },
            },
        })

        if result.user is None:
            raise HTTPException(status_code=400, detail="Signup failed")

        return {
            "message": "Account created. Please check your email to verify.",
            "user_id": result.user.id,
            "email": result.user.email,
        }

    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower():
            raise HTTPException(status_code=409, detail="Email already registered")
        raise HTTPException(status_code=400, detail=error_msg)


@router.post("/login")
async def login(request: SignInRequest):
    """
    Login with email + password. Supabase rejects unverified emails.
    Returns session tokens.
    """
    try:
        result = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })

        if result.session is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "expires_in": result.session.expires_in,
            "user": {
                "id": result.user.id,
                "email": result.user.email,
                "role": result.user.user_metadata.get("role", "participant"),
                "name": result.user.user_metadata.get("name", ""),
            },
        }

    except Exception as e:
        error_msg = str(e)
        if "email not confirmed" in error_msg.lower():
            raise HTTPException(
                status_code=403,
                detail="Email not verified. Please check your inbox.",
            )
        if "invalid" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid email or password")
        raise HTTPException(status_code=400, detail=error_msg)


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return user


@router.post("/logout")
async def logout():
    """
    Logout is handled client-side by clearing the Supabase session.
    This endpoint exists for API completeness.
    """
    return {"message": "Logged out successfully"}
