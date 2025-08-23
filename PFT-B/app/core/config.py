from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator

class Settings(BaseSettings):
    APP_NAME: str = "My FastAPI App"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecret"  # JWT için
    DATABASE_URL: str = "sqlite:///./app.db"
    ALLOW_ORIGINS: list[AnyHttpUrl] | list[str] = []
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    @field_validator("ALLOW_ORIGINS", mode="before")
    @classmethod
    def split_origins(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
