from datetime import datetime, timedelta
from typing import Optional, Union, Any, Callable, Dict, Annotated

from fastapi import Depends, HTTPException, status, Request, Header, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import ValidationError

from token_config import settings
from user.User import UserDocument, User, Role
from auth.schemas import TokenPayload

# Security scheme for Swagger UI
security = HTTPBearer(
    scheme_name="Bearer Authentication",
    description="Enter JWT Bearer token",
    auto_error=False
)

async def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

async def get_token_from_header(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> str:
    """
    Extract Bearer token from the Authorization header
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Authorization header is missing",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid authentication scheme",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token is missing",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return credentials.credentials

async def get_current_user(token: str = Depends(get_token_from_header)) -> UserDocument:
    """
    Validate access token and return current user
    """
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        
        if datetime.fromtimestamp(token_data.exp) < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await UserDocument.get(token_data.sub)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return user

def get_current_active_user(current_user: UserDocument = Depends(get_current_user)) -> UserDocument:
    """
    Check if the current user is active
    """
    # You can add additional checks here, like checking if the user is disabled
    return current_user

# Role-based access control
def has_role(required_roles: list[Role]):
    """
    Check if the current user has the required role
    """
    async def role_checker(current_user: UserDocument = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {[role.value for role in required_roles]}"
            )
        return current_user
    
    return role_checker 