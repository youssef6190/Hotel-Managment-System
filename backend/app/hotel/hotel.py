from beanie import Document
from typing import List, Optional
from enum import Enum
from bson import ObjectId
from common_models.common import MongoBaseModel, PydanticObjectId
from pydantic import BaseModel, Field

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

# Response model that includes the serialized ID
class HotelResponse(Hotel):
    id: str = Field(..., description="Hotel ID as string")

class HotelDocument(Document, Hotel):
    class Settings:
        collection = "hotels" # Settings for Beanie Document, specifying the MongoDB collection name
        collection = "hotels" # Settings for Beanie Document, specifying the MongoDB collection name
