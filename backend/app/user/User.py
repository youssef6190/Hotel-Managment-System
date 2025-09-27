from beanie import Document
from pydantic import Field, ConfigDict
from typing import List, Optional
from enum import Enum
from bson import ObjectId
from passlib.context import CryptContext
from common_models.common import MongoBaseModel, PydanticObjectId
from datetime import datetime

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class Role(Enum):
    VIEWER = "viewer"
    GUEST = "guest"  # New role for users who can make reservations and payments
    HOTEL_ADMIN = "hotel_admin"
    SUPER_ADMIN = "super_admin"

class UserBase(MongoBaseModel):  # UserBase is the base class for User and UserCreate
    full_name: str
    email: str
    age: int
    mobile_number: str 
    job_type: Optional[str] = None
    gender: str
    role: Role
    is_active: bool = True
    created_at: Optional[datetime] = Field(default_factory=datetime.now)

class UserCreate(UserBase): # UserCreate is used to create a new user 
    password: str

class User(UserBase):
    hashed_password: str
    
    model_config = ConfigDict(from_attributes=True)
        
    @classmethod
    def create(cls, user_create: UserCreate):
        """Create a User instance with hashed password"""
        return cls(
            **user_create.model_dump(exclude={"password"}),
            hashed_password=pwd_context.hash(user_create.password)
        )
    
    def verify_password(self, plain_password: str) -> bool:
        """Verify that the provided password matches the hashed password"""
        return pwd_context.verify(plain_password, self.hashed_password)
    
    def upgrade_to_guest(self):
        """Upgrade user role from VIEWER to GUEST"""
        if self.role == Role.VIEWER:
            self.role = Role.GUEST
            return True
        return False

class UserResponse(UserBase):
    """User response model that includes the ID field"""
    id: str = Field(description="User ID")
    
    @classmethod
    def from_document(cls, doc: 'UserDocument'):
        """Convert UserDocument to UserResponse"""
        return cls(
            id=str(doc.id),
            full_name=doc.full_name,
            email=doc.email,
            age=doc.age,
            mobile_number=doc.mobile_number,
            job_type=doc.job_type,
            gender=doc.gender,
            role=doc.role,
            is_active=doc.is_active,
            created_at=doc.created_at
        )

class UserDocument(Document, User):
    class Settings:
        collection = "users"  # Settings for Beanie Document, specifying the MongoDB collection name
