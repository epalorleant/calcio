"""Authentication schemas."""
from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema."""
    user_id: int | None = None
    email: str | None = None


class UserLogin(BaseModel):
    """User login request schema."""
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    """User registration request schema."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8)
    player_id: int | None = None  # Optional: link to existing player


class UserRead(BaseModel):
    """User read schema."""
    id: int
    email: str
    username: str
    is_active: bool
    is_admin: bool
    is_root: bool
    player_id: int | None = None

    class Config:
        from_attributes = True


class UserWithPlayer(UserRead):
    """User with player relationship."""
    player: dict | None = None


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    refresh_token: str


class PasswordChangeRequest(BaseModel):
    """Password change request schema."""
    current_password: str
    new_password: str = Field(..., min_length=8)


class GrantAdminRequest(BaseModel):
    """Grant admin role request schema."""
    user_id: int

