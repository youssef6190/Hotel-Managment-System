from beanie import Document
from typing import List, Optional
from enum import Enum
from bson import ObjectId
from common_models.common import MongoBaseModel, PydanticObjectId
from pydantic import Field, BaseModel

class TYPE(Enum):
    SINGLE = "Single"
    DOUBLE = "Double"
    SUITE = "Suite"
    
class Room(MongoBaseModel):
    room_number: int  # Unique identifier for the room within the hotel
    hotel_id: Optional[PydanticObjectId] = None     # ID of the hotel this room belongs to
    type_name: TYPE
    description: str
    max_occupancy: int
    price_per_night: float

# Response model that includes the serialized ID
class RoomResponse(BaseModel):
    id: str = Field(..., description="Room ID as string")
    room_number: int
    hotel_id: Optional[str] = None  # Serialized as string for API response
    type_name: TYPE
    description: str
    max_occupancy: int
    price_per_night: float

class RoomDocument(Document, Room):
    class Settings:
        collection = "rooms"  # Settings for Beanie Document, specifying the MongoDB collection name