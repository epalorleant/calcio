"""Authentication schemas."""
from pydantic import BaseModel, EmailStr, Field, model_validator


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
    create_player: bool = False  # Optional: create a new player profile
    player_name: str | None = Field(None, max_length=255)

    @model_validator(mode="after")
    def validate_player_name_when_creating(self) -> "UserRegister":
        if self.create_player and not self.player_id:
            if not self.player_name or not self.player_name.strip():
                raise ValueError("player_name is required when create_player is true")
        return self


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


class LinkUserToPlayerRequest(BaseModel):
    """Link user to player request schema."""
    user_id: int
    player_id: int | None = None  # None to unlink

