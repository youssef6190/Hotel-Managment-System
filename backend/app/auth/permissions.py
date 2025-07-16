from functools import wraps
from typing import List, Dict, Any
from fastapi import HTTPException, status, Depends
from user.User import Role, UserDocument
from auth.auth import get_current_user

# Define CRUD operations
class CRUDOperation:
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"

# Define role permissions for each entity
ROLE_PERMISSIONS: Dict[str, Dict[str, List[Role]]] = {
    "hotel": {
        CRUDOperation.CREATE: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN],
        CRUDOperation.READ: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN, Role.VIEWER],
        CRUDOperation.UPDATE: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN],
        CRUDOperation.DELETE: [Role.SUPER_ADMIN],
    },
    "user": {
        CRUDOperation.CREATE: [Role.SUPER_ADMIN],  # User registration is separate
        CRUDOperation.READ: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN],  # Users can read their own profile separately
        CRUDOperation.UPDATE: [Role.SUPER_ADMIN],  # Users can update their own profile separately  
        CRUDOperation.DELETE: [Role.SUPER_ADMIN],
    },
    "room": {
        CRUDOperation.CREATE: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN],
        CRUDOperation.READ: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN, Role.VIEWER],
        CRUDOperation.UPDATE: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN],
        CRUDOperation.DELETE: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN],
    },
    "reservation": {
        CRUDOperation.CREATE: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN, Role.GUEST],  # Only GUEST users can make reservations
        CRUDOperation.READ: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN, Role.GUEST, Role.VIEWER],
        CRUDOperation.UPDATE: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN],
        CRUDOperation.DELETE: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN],
    },
    "payment": {
        CRUDOperation.CREATE: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN, Role.GUEST],  # Only GUEST users can make payments
        CRUDOperation.READ: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN, Role.GUEST, Role.VIEWER],
        CRUDOperation.UPDATE: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN],
        CRUDOperation.DELETE: [Role.SUPER_ADMIN],
    },
    "availability": {
        CRUDOperation.CREATE: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN],
        CRUDOperation.READ: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN, Role.VIEWER],
        CRUDOperation.UPDATE: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN],
        CRUDOperation.DELETE: [Role.SUPER_ADMIN, Role.HOTEL_ADMIN],
    }
}

def require_permission(entity: str, operation: str):
    """
    Decorator to check if the current user has permission for the specified operation on the entity
    """
    def decorator(current_user: UserDocument = Depends(get_current_user)):
        # Check if entity and operation exist in permissions
        if entity not in ROLE_PERMISSIONS:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Entity '{entity}' not configured in permissions"
            )
        
        if operation not in ROLE_PERMISSIONS[entity]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Operation '{operation}' not configured for entity '{entity}'"
            )
        
        # Check if user has required role
        required_roles = ROLE_PERMISSIONS[entity][operation]
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {[role.value for role in required_roles]}. Your role: {current_user.role.value}"
            )
        
        return current_user
    
    return decorator

def can_access_own_data(current_user: UserDocument = Depends(get_current_user)):
    """
    Allow users to access their own data regardless of role
    """
    return current_user

# Specific permission functions for common use cases
def require_hotel_permission(operation: str):
    return require_permission("hotel", operation)

def require_user_permission(operation: str):
    return require_permission("user", operation)

def require_room_permission(operation: str):
    return require_permission("room", operation)

def require_reservation_permission(operation: str):
    return require_permission("reservation", operation)

def require_payment_permission(operation: str):
    return require_permission("payment", operation)

def require_availability_permission(operation: str):
    return require_permission("availability", operation)

# Helper function to check if user owns the resource
async def check_resource_ownership(current_user: UserDocument, resource_user_id: str) -> bool:
    """
    Check if the current user owns the resource
    """
    return str(current_user.id) == str(resource_user_id)

def require_ownership_or_admin(entity: str):
    """
    Allow access if user owns the resource or is admin
    """
    def decorator(current_user: UserDocument = Depends(get_current_user)):
        # Super admin and hotel admin can access all resources
        if current_user.role in [Role.SUPER_ADMIN, Role.HOTEL_ADMIN]:
            return current_user
        
        # For viewers, they can only access their own data
        # This will be checked in the individual route handlers
        return current_user
    
    return decorator
