from beanie import Document
from typing import List, Optional
from enum import Enum
from bson import ObjectId
from common_models.common import MongoBaseModel, PydanticObjectId

class TYPE(Enum):
    SINGLE = "Single"
    DOUBLE = "Double"
    SUITE = "Suite"
    
class Room(MongoBaseModel):
    room_number: int  # Unique identifier for the room within the hotel
    hotel_id:  Optional[str] = None     # ID of the hotel this room belongs to
    type_name: TYPE
    description: str
    max_occupancy: int
    price_per_night: float

class RoomDocument(Document, Room):
    class Settings:
        collection = "rooms"  # Settings for Beanie Document, specifying the MongoDB collection name