from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    APP_NAME: str = Field(default="AgriXplain")
    APP_ENV: str = Field(default="dev")
    APP_HOST: str = Field(default="0.0.0.0")
    APP_PORT: int = Field(default=8000)

    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)

    WEATHER_API_KEY: str | None = None
    WEATHER_API_BASE: str | None = None

settings = Settings()
