from beanie import Document
from typing import List, Optional
from enum import Enum
from bson import ObjectId
from common_models.common import MongoBaseModel, PydanticObjectId

class Status(Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    PENDING = "pending"

class Payment(MongoBaseModel):
    reservation_id:  Optional[PydanticObjectId] = None  # ID of the reservation associated with this payment
    user_id: Optional[PydanticObjectId] = None  # ID of the user who made the payment
    amount: float
    payment_method: str
    payment_status: Status
    transaction_date: str  # Date of the transaction in "YYYY-MM-DD" format

class PaymentDocument(Document, Payment):
    class Settings:
        collection = "payments"  # Settings for Beanie Document, specifying the MongoDB collection name