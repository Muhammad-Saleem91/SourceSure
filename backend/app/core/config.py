"""
Application settings.

Single source of truth for environment-driven configuration. Never read
os.environ directly elsewhere in the codebase — always go through
`get_settings()` so config stays testable (override via dependency
injection) and centrally validated at startup.
"""

from functools import lru_cache
from typing import List

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strictly typed application settings, loaded from environment / .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Core environment -------------------------------------------------
    APP_ENV: str = Field(default="local", description="local | test | prod")

    # --- Database -----------------------------------------------------------
    DATABASE_URL: str = Field(
        default="sqlite:///./sourcesure.db",
        description="SQLAlchemy connection string.",
    )

    # --- File storage ---------------------------------------------------
    UPLOAD_DIR: str = Field(default="./data/uploads")
    MAX_UPLOAD_MB: int = Field(default=20, gt=0)

    # --- LLM provider -----------------------------------------------------
    LLM_PROVIDER: str = Field(default="gemini")
    LLM_MODEL: str = Field(default="gemini-2.5-flash")
    LLM_API_KEY: str = Field(default="", repr=False)  # never log this value

    # --- CORS ---------------------------------------------------------------
    # Stored as a raw comma-separated string (pydantic-settings would otherwise
    # try to JSON-decode a List[str] env value); exposed as a list via the
    # computed property below.
    ALLOWED_ORIGINS: str = Field(default="http://localhost:3000")

    @computed_field  # type: ignore[misc]
    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    def __repr__(self) -> str:  # pragma: no cover - defensive log-safety
        # Guard against accidental `print(settings)` / log calls leaking secrets.
        return "Settings(APP_ENV=%r, LLM_PROVIDER=%r, LLM_MODEL=%r)" % (
            self.APP_ENV,
            self.LLM_PROVIDER,
            self.LLM_MODEL,
        )


@lru_cache
def get_settings() -> Settings:
    """Singleton accessor — cached so the .env file is parsed exactly once."""
    return Settings()
