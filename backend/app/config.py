from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Программный модуль оценки производственных рисков СИПРсОП"
    database_url: str = "sqlite+aiosqlite:///./data/risk_assessment.db"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    data_dir: Path = Path("./data")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
