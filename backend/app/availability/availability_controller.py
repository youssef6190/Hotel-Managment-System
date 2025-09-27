from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from availability.availability import Availability, AvailabilityDocument
from bson import ObjectId
from datetime import datetime
from auth.permissions import (
    require_availability_permission, 
    CRUDOperation
)
from user.User import UserDocument

router = APIRouter()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_availability(
    availability_data: Availability,
    current_user: UserDocument = Depends(require_availability_permission(CRUDOperation.CREATE))
):
    """Create new availability - Requires SUPER_ADMIN or HOTEL_ADMIN role"""
    try:
        availability = AvailabilityDocument(**availability_data.model_dump())
        await availability.insert()
        return {
            "message": "Availability created successfully", 
            "id": str(availability.id),
            "created_by": current_user.full_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating availability: {str(e)}")

@router.get("/", response_model=List[Availability])
async def get_all_availabilities(
    current_user: UserDocument = Depends(require_availability_permission(CRUDOperation.READ))
):
    """Get all availabilities - Requires SUPER_ADMIN, HOTEL_ADMIN or VIEWER role"""
    try:
        availabilities = await AvailabilityDocument.find_all().to_list()
        return availabilities
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching availabilities: {str(e)}")

@router.get("/{availability_id}", response_model=Availability)
async def get_availability(availability_id: str):
    try:
        availability = await AvailabilityDocument.get(ObjectId(availability_id))
        if not availability:
            raise HTTPException(status_code=404, detail="Availability not found")
        return availability
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching availability: {str(e)}")

@router.patch("/{availability_id}", response_model=dict)
async def update_availability(availability_id: str, availability_data: Availability):
    try:
        availability = await AvailabilityDocument.get(ObjectId(availability_id))
        if not availability:
            raise HTTPException(status_code=404, detail="Availability not found")
        
        update_data = availability_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(availability, key, value)
        
        await availability.save()
        return {"message": "Availability updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating availability: {str(e)}")

@router.delete("/{availability_id}", response_model=dict)
async def delete_availability(availability_id: str):
    try:
        availability = await AvailabilityDocument.get(ObjectId(availability_id))
        if not availability:
            raise HTTPException(status_code=404, detail="Availability not found")
        
        await availability.delete()
        return {"message": "Availability deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting availability: {str(e)}")

@router.get("/hotel/{hotel_id}", response_model=List[Availability])
async def get_availabilities_by_hotel(hotel_id: str):
    try:
        availabilities = await AvailabilityDocument.find({"hotel_id": ObjectId(hotel_id)}).to_list()
        return availabilities
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching availabilities for hotel: {str(e)}")

@router.get("/check", response_model=List[Availability])
async def check_availability(hotel_id: str, room_id: str, start_date: str, end_date: str):
    try:
        # Parse dates
        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
        
        # Ensure start date is before end date
        if start_date_obj > end_date_obj:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
        
        # Check availability for the specified range
        availabilities = await AvailabilityDocument.find(
            {
                "hotel_id": ObjectId(hotel_id),
                "room_id": ObjectId(room_id),
                "date": {"$gte": start_date, "$lte": end_date},
                "total_rooms": {"$gt": "reserved_rooms"}
            }
        ).to_list()
        
        return availabilities
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking availability: {str(e)}")
