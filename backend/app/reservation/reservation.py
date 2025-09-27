from beanie import Document
from typing import List, Optional
from enum import Enum
from bson import ObjectId
from common_models.common import MongoBaseModel, PydanticObjectId

class Status(Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    PENDING = "pending"

class Reservation(MongoBaseModel):
    id: Optional[str] = None  # Reservation ID
    hotel_id:  Optional[PydanticObjectId] = None  # ID of the hotel being reserved
    user_id:   Optional[PydanticObjectId] = None # ID of the user making the reservation
    room_id:   Optional[PydanticObjectId] = None # ID of the room being reserved
    start_date: str  # Start date of the reservation in "YYYY-MM-DD" format
    end_date: str  # End date of the reservation in "YYYY-MM-DD" format
    status: Status  # Status of the reservation (e.g., "confirmed", "cancelled")
    number_of_guests: int  # Number of guests for the reservation
    price: float  # Total price for the reservation

class ReservationDocument(Document, Reservation):
    class Settings:
        collection = "reservations"  # Settings for Beanie Document, specifying the MongoDB collection name
