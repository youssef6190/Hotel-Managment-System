from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import HTTPBearer

from auth.auth import create_access_token, get_current_user, security
from auth.schemas import Token, LoginRequest
from token_config import settings
from user.User import UserDocument

router = APIRouter()

@router.post("/token", response_model=Token)
async def login_for_access_token(login_data: LoginRequest = Body(...)):
    """
    Get access token for authentication
    """
    from user.User import Role
    
    user = await UserDocument.find_one({"email": login_data.email})
    if not user or not user.verify_password(login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Automatically upgrade all VIEWER users to GUEST when they log in
    role_upgraded = False
    if user.role == Role.VIEWER:
        user.upgrade_to_guest()
        await user.save()
        role_upgraded = True
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = await create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    response = {
        "access_token": access_token,
        "token_type": "bearer"
    }
    
    if role_upgraded:
        response.update({
            "role_upgraded": True,
            "new_role": user.role.value,
            "message": "Role upgraded to GUEST. You can now make reservations and payments."
        })
    
    return response


@router.get("/me", response_model=dict)
async def read_users_me(current_user: UserDocument = Depends(get_current_user)):
    """
    Get current user information
    """
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: UserDocument = Depends(get_current_user)):
    """
    Refresh access token
    """
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = await create_access_token(
        subject=current_user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/upgrade-to-guest")
async def upgrade_to_guest(current_user: UserDocument = Depends(get_current_user)):
    """
    Upgrade user role from VIEWER to GUEST to enable reservations and payments
    """
    from user.User import Role
    
    if current_user.role != Role.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot upgrade from {current_user.role.value} role. Only VIEWER users can be upgraded to GUEST."
        )
    
    # Update user role using the method we added
    if current_user.upgrade_to_guest():
        await current_user.save()
        
        # Generate new token with updated role
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = await create_access_token(
            subject=current_user.id, expires_delta=access_token_expires
        )
        
        return {
            "message": "Successfully upgraded to GUEST role",
            "new_role": current_user.role.value,
            "permissions": "You can now make reservations and payments",
            "access_token": access_token,
            "token_type": "bearer"
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to upgrade role"
        ) 