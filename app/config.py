from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/smartmatch"
    JWT_SECRET: str = "dev"
    class Config:
        env_file = ".env"

settings = Settings()
