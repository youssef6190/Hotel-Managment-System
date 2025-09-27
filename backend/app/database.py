from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from hotel.hotel import  HotelDocument
from room.room import RoomDocument
from user.User import UserDocument
from reservation.reservation import ReservationDocument
from availability.availability import AvailabilityDocument
from payment.payment import PaymentDocument
from config import settings
from typing import Optional

class DatabaseConnection:
    _instance: Optional['DatabaseConnection'] = None
    _client: Optional[AsyncIOMotorClient] = None
    _db = None
    
    @property
    def client(self):
        return self._client

    @property
    def db(self):
        return self._db

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls) # create a new instance
        return cls._instance

    async def initialize(self):
        if not self._client:                                           # check if client is not initialized
            self._client = AsyncIOMotorClient(settings.mongodb_url)    # connect to MongoDB
            self._db = self._client.get_default_database()             # Automatically uses 'hotel_db'
            await init_beanie(
                database=self._db,
                document_models=[HotelDocument, UserDocument, RoomDocument, ReservationDocument, AvailabilityDocument, PaymentDocument]
            )


async def initiate_database():
    db_connection = DatabaseConnection()
    await db_connection.initialize()
    return db_connection
