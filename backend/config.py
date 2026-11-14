import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "KATTR0LI (கற்றொளி) API"
    PROJECT_VERSION: str = "2.0.0"
    BRAND_TAMIL: str = "கற்றொளி"
    BRAND_TAGLINE: str = "Learn. Discover. Evolve."
    BRAND_MEANING: str = "The light of learning"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "skillpilot-super-secret-jwt-key-2026-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./skillpilot.db")
    
    # LLM Settings (optional - fallback active if missing)
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # ChromaDB RAG directory
    CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
