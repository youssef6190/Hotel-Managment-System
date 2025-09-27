from beanie import Document
from typing import List, Optional
from enum import Enum
from bson import ObjectId
from common_models.common import MongoBaseModel, PydanticObjectId

class Availability(MongoBaseModel):
    hotel_id: Optional[PydanticObjectId] = None  # ID of the hotel for which availability is being checked
    room_id:  Optional[PydanticObjectId] = None # ID of the room for which availability is being checked
    date: str  # Date in "YYYY-MM-DD" format
    total_rooms: int  # Total number of rooms for the specified date and room
    reserved_rooms: int  # Number of rooms already reserved for the specified date and room

class AvailabilityDocument(Document, Availability):
    class Settings:
        collection = "availability" # Settings for Beanie Document, specifying the MongoDB collection name