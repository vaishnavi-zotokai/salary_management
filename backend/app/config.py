from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")
    DATABASE_URL: str = "sqlite:///./salary.db"


settings = Settings()