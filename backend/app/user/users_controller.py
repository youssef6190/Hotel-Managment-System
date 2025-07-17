from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from user.User import UserCreate, User, UserDocument, UserBase, UserResponse, Role
from bson import ObjectId
from common_models.common import PydanticObjectId
from passlib.context import CryptContext
from auth.auth import get_current_user, has_role
from auth.permissions import (
    require_user_permission, 
    CRUDOperation,
    can_access_own_data
)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        # Check if user with this email already exists
        existing_user = await UserDocument.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Ensure role is valid
        try:
            role_value = user_data.role.value if isinstance(user_data.role, Role) else user_data.role
            user_data.role = Role(role_value)
        except ValueError:
            valid_roles = [r.value for r in Role]
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid role. Valid roles are: {valid_roles}"
            )
        
        # Create user with hashed password
        user = User.create(user_data)
        user_doc = UserDocument(**user.model_dump())
        await user_doc.insert()
        
        return {"message": "User registered successfully", "id": str(user_doc.id)}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error registering user: {str(e)}")

@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    current_user: UserDocument = Depends(get_current_user)
):
    """Get all users - Requires SUPER_ADMIN role only"""
    try:
        # Only SUPER_ADMIN can view all users
        if current_user.role != Role.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Only SUPER_ADMIN can view all users")
        
        users = await UserDocument.find_all().to_list()
        # Convert to UserResponse to include IDs
        return [UserResponse.from_document(user) for user in users]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserDocument = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse.from_document(current_user)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str, 
    current_user: UserDocument = Depends(get_current_user)
):
    """Get a user by ID - Users can view their own profile, only SUPER_ADMIN can view others"""
    try:
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        # Check if user can access this data (own data or SUPER_ADMIN only)
        is_own_data = str(current_user.id) == user_id
        is_super_admin = current_user.role == Role.SUPER_ADMIN
        
        if not is_own_data and not is_super_admin:
            raise HTTPException(status_code=403, detail="Not authorized to view this user")
        
        user = await UserDocument.get(ObjectId(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse.from_document(user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")

@router.patch("/{user_id}", response_model=dict)
async def update_user(
    user_id: str, 
    user_data: UserBase, 
    current_user: UserDocument = Depends(get_current_user)
):
    """Update a user by ID - Users can update their own profile, only SUPER_ADMIN can update others"""
    try:
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        # Check if user can access this data (own data or SUPER_ADMIN only)
        is_own_data = str(current_user.id) == user_id
        is_super_admin = current_user.role == Role.SUPER_ADMIN
        
        if not is_own_data and not is_super_admin:
            raise HTTPException(status_code=403, detail="Not authorized to update this user")
        
        user = await UserDocument.get(ObjectId(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update the user with new data
        user_dict = user_data.model_dump(exclude_unset=True)
        for key, value in user_dict.items():
            setattr(user, key, value)
        
        await user.save()
        return {
            "message": "User updated successfully",
            "updated_by": current_user.full_name
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")

@router.delete("/{user_id}", response_model=dict)
async def delete_user(
    user_id: str,
    current_user: UserDocument = Depends(require_user_permission(CRUDOperation.DELETE))
):
    """Delete a user by ID - Requires SUPER_ADMIN role only"""
    try:
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        user = await UserDocument.get(ObjectId(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        await user.delete()
        return {
            "message": "User deleted successfully",
            "deleted_by": current_user.full_name
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")

@router.get("/search/", response_model=List[UserBase])
async def search_users(
    email: Optional[str] = None, 
    full_name: Optional[str] = None, 
    role: Optional[str] = None,
    current_user: UserDocument = Depends(get_current_user)
):
    """Search users by email, full name, or role - Requires SUPER_ADMIN role only"""
    try:
        # Only SUPER_ADMIN can search all users
        if current_user.role != Role.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Only SUPER_ADMIN can search users")
        
        query = {}
        if email:
            query["email"] = {"$regex": email, "$options": "i"}  # Case-insensitive search
        if full_name:
            query["full_name"] = {"$regex": full_name, "$options": "i"}
        if role:
            query["role"] = role
        
        users = await UserDocument.find(query).to_list()
        return users
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching users: {str(e)}")

@router.patch("/{user_id}/change-password", response_model=dict)
async def change_password(user_id: str, current_password: str, new_password: str, current_user: UserDocument = Depends(get_current_user)):
    """Change user password - requires authentication"""
    try:
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        # Only allow users to change their own password unless they're an admin
        if str(current_user.id) != user_id and current_user.role != Role.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Not authorized to change this user's password")
        
        user = await UserDocument.get(ObjectId(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password
        if not user.verify_password(current_password):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Update password
        user.hashed_password = pwd_context.hash(new_password)
        await user.save()
        
        return {"message": "Password changed successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error changing password: {str(e)}")

@router.put("/{user_id}/toggle-status", response_model=dict)
async def toggle_user_status(
    user_id: str,
    current_user: UserDocument = Depends(get_current_user)
):
    """Toggle user active status - Requires SUPER_ADMIN role only"""
    try:
        # Only SUPER_ADMIN can toggle user status
        if current_user.role != Role.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Only SUPER_ADMIN can toggle user status")
        
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        user = await UserDocument.get(ObjectId(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Toggle the active status
        user.is_active = not user.is_active
        await user.save()
        
        return {
            "message": f"User {'activated' if user.is_active else 'deactivated'} successfully",
            "is_active": user.is_active,
            "updated_by": current_user.full_name
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error toggling user status: {str(e)}")

@router.put("/{user_id}/role", response_model=dict)
async def update_user_role(
    user_id: str,
    role_data: dict,
    current_user: UserDocument = Depends(get_current_user)
):
    """Update user role - Requires SUPER_ADMIN role only"""
    try:
        # Only SUPER_ADMIN can update user roles
        if current_user.role != Role.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Only SUPER_ADMIN can update user roles")
        
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        user = await UserDocument.get(ObjectId(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Validate the new role
        new_role = role_data.get('role')
        if not new_role:
            raise HTTPException(status_code=400, detail="Role is required")
        
        try:
            role_enum = Role(new_role)
            user.role = role_enum
        except ValueError:
            valid_roles = [r.value for r in Role]
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role. Valid roles are: {valid_roles}"
            )
        
        await user.save()
        
        return {
            "message": "User role updated successfully",
            "new_role": user.role.value,
            "updated_by": current_user.full_name
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user role: {str(e)}")
