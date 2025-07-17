from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from reservation.reservation import Reservation, ReservationDocument, Status
from availability.availability import AvailabilityDocument
from bson import ObjectId
from datetime import datetime
from auth.permissions import (
    require_reservation_permission, 
    CRUDOperation,
    can_access_own_data
)
from user.User import UserDocument
from auth.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    reservation_data: Reservation,
    current_user: UserDocument = Depends(get_current_user)
):
    """Create a new reservation - Any authenticated user can create their own reservation"""
    try:
        # Validate required fields
        if not reservation_data.hotel_id:
            raise HTTPException(status_code=400, detail="Hotel ID is required")
        if not reservation_data.room_id:
            raise HTTPException(status_code=400, detail="Room ID is required")
        
        # Check if the room is available for the selected dates
        start_date = reservation_data.start_date
        end_date = reservation_data.end_date
        
        # Parse dates for validation
        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
        
        # Ensure start date is before end date
        if start_date_obj >= end_date_obj:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
        
        # Set the user_id to the current authenticated user
        reservation_dict = reservation_data.model_dump()
        reservation_dict["user_id"] = current_user.id
        
        # Create the reservation
        reservation = ReservationDocument(**reservation_dict)
        await reservation.insert()
        
        return {
            "message": "Reservation created successfully", 
            "id": str(reservation.id),
            "created_by": current_user.full_name
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Invalid date format. Use YYYY-MM-DD: {str(ve)}")
    except Exception as e:
        # Log the error for debugging
        print(f"Error creating reservation: {str(e)}")
        print(f"Reservation data: {reservation_data}")
        raise HTTPException(status_code=500, detail=f"Error creating reservation: {str(e)}")

@router.get("/", response_model=List[Reservation])
async def get_all_reservations(
    current_user: UserDocument = Depends(require_reservation_permission(CRUDOperation.READ))
):
    """Get all reservations - Requires SUPER_ADMIN or HOTEL_ADMIN role"""
    try:
        reservations = await ReservationDocument.find_all().to_list()
        return reservations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reservations: {str(e)}")

@router.get("/{reservation_id}", response_model=Reservation)
async def get_reservation(
    reservation_id: str,
    current_user: UserDocument = Depends(get_current_user)
):
    """Get a reservation by ID - Users can view their own reservations, admins can view any"""
    try:
        if not ObjectId.is_valid(reservation_id):
            raise HTTPException(status_code=400, detail="Invalid reservation ID format")
        
        reservation = await ReservationDocument.get(ObjectId(reservation_id))
        if not reservation:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        # Check if user can access this reservation (own data or has admin permission)
        is_own_reservation = str(current_user.id) == str(reservation.user_id)
        has_admin_permission = current_user.role in ["SUPER_ADMIN", "HOTEL_ADMIN"]
        
        if not is_own_reservation and not has_admin_permission:
            raise HTTPException(status_code=403, detail="Not authorized to view this reservation")
        
        return reservation
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reservation: {str(e)}")

@router.patch("/{reservation_id}", response_model=dict)
async def update_reservation(
    reservation_id: str, 
    reservation_data: Reservation,
    current_user: UserDocument = Depends(get_current_user)
):
    """Update a reservation - Users can update their own reservations, admins can update any"""
    try:
        if not ObjectId.is_valid(reservation_id):
            raise HTTPException(status_code=400, detail="Invalid reservation ID format")
        
        reservation = await ReservationDocument.get(ObjectId(reservation_id))
        if not reservation:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        # Check if user can access this reservation (own data or has admin permission)
        is_own_reservation = str(current_user.id) == str(reservation.user_id)
        has_admin_permission = current_user.role in ["SUPER_ADMIN", "HOTEL_ADMIN"]
        
        if not is_own_reservation and not has_admin_permission:
            raise HTTPException(status_code=403, detail="Not authorized to update this reservation")
        
        update_data = reservation_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(reservation, key, value)
        
        await reservation.save()
        return {
            "message": "Reservation updated successfully",
            "updated_by": current_user.full_name
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating reservation: {str(e)}")

@router.delete("/{reservation_id}", response_model=dict)
async def delete_reservation(
    reservation_id: str,
    current_user: UserDocument = Depends(get_current_user)
):
    """Delete a reservation - Users can delete their own reservations, admins can delete any"""
    try:
        if not ObjectId.is_valid(reservation_id):
            raise HTTPException(status_code=400, detail="Invalid reservation ID format")
        
        reservation = await ReservationDocument.get(ObjectId(reservation_id))
        if not reservation:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        # Check if user can access this reservation (own data or has admin permission)
        is_own_reservation = str(current_user.id) == str(reservation.user_id)
        has_admin_permission = current_user.role in ["SUPER_ADMIN", "HOTEL_ADMIN"]
        
        if not is_own_reservation and not has_admin_permission:
            raise HTTPException(status_code=403, detail="Not authorized to delete this reservation")
        
        await reservation.delete()
        
        return {
            "message": "Reservation deleted successfully",
            "deleted_by": current_user.full_name
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting reservation: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting reservation: {str(e)}")

@router.get("/user/{user_id}", response_model=List[Reservation])
async def get_user_reservations(user_id: str):
    try:
        reservations = await ReservationDocument.find({"user_id": ObjectId(user_id)}).to_list()
        return reservations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reservations for user: {str(e)}")

@router.get("/hotel/{hotel_id}", response_model=List[Reservation])
async def get_hotel_reservations(hotel_id: str):
    try:
        reservations = await ReservationDocument.find({"hotel_id": ObjectId(hotel_id)}).to_list()
        return reservations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reservations for hotel: {str(e)}")

@router.patch("/{reservation_id}/status", response_model=dict)
async def update_reservation_status(reservation_id: str, status: Status):
    try:
        reservation = await ReservationDocument.get(ObjectId(reservation_id))
        if not reservation:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        reservation.status = status
        await reservation.save()
        
        return {"message": f"Reservation status updated to {status.value}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating reservation status: {str(e)}")
