# app/config.py
from pydantic_settings import BaseSettings  # ✅ Works with Pydantic v2+

class Settings(BaseSettings):
    mongodb_url: str = "mongodb+srv://yismail:l1wGDrM8vKH4sygH@cluster0.oqymebp.mongodb.net/hotel_db"

settings = Settings()
