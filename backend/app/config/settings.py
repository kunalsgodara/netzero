from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache



_ENV_FILE = str(Path(__file__).resolve().parent.parent.parent / ".env")


class Settings(BaseSettings):
    
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/netzeroworks"

    
    secret_key: str = "your-secret-key-change-in-production"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"

    
    groq_api_key: str = ""

    
    frontend_url: str = "http://localhost:5173"

    
    upload_dir: str = "./uploads"

    
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "NetZeroWorks <noreply@netzeroworks.com>"

    model_config = {
        "env_file": _ENV_FILE,
        "case_sensitive": False,
        "extra": "ignore"
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
