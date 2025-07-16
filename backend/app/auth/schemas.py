from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    
class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    
class LoginRequest(BaseModel):
    email: str
    password: str
    # No longer need upgrade_to_guest option as all viewers are automatically upgraded