from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

# Resolve the .env file relative to this file's location (backend/.env),
# so it is found regardless of the working directory when the server starts.
_ENV_FILE = str(Path(__file__).resolve().parent.parent.parent / ".env")


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/netzeroworks"

    # Auth
    secret_key: str = "your-secret-key-change-in-production"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"

    # Groq LLM
    groq_api_key: str = ""

    # Frontend
    frontend_url: str = "http://localhost:5173"

    # File uploads
    upload_dir: str = "./uploads"

    class Config:
        env_file = _ENV_FILE
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
