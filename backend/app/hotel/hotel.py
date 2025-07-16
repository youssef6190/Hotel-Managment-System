from beanie import Document
from typing import List, Optional
from enum import Enum
from bson import ObjectId
from common_models.common import MongoBaseModel, PydanticObjectId
from pydantic import BaseModel, Field, field_validator

class Location(MongoBaseModel):
    country: str
    city: str


class ContactInfo(MongoBaseModel):
    phone: str
    email: str
    website: Optional[str]
    
class Amenities(MongoBaseModel):
    gym: bool
    spa: bool
    wifi: bool
    parking: bool
    pool_count: int

class Hotel(MongoBaseModel): # Beanie Document model for MongoDB the base class
    name: str
    contact_info: ContactInfo
    location: Location
    gallery: Optional[List[str]] = [] # List of URLs for hotel images
    amenities: Amenities 
    working_hours: str
    max_reservations_per_day: int
    tax_number: str   # Integrated under HotelAdmin, can be optional
    review_count: int = 0 # Number of reviews, default to 0
    rating: Optional[float] = None # Average rating, can be None if no reviews exist
    admin_id: Optional[PydanticObjectId] = None   # ID of the hotel admin who manages this hotel

    @field_validator('admin_id', mode='before')
    @classmethod
    def validate_admin_id(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            try:
                return ObjectId(v)
            except Exception:
                return None
        return v


# Response model that includes the serialized ID
class HotelResponse(Hotel):
    id: str = Field(..., description="Hotel ID as string")

class HotelDocument(Document, Hotel):
    class Settings:
        collection = "hotels" # Settings for Beanie Document, specifying the MongoDB collection name
