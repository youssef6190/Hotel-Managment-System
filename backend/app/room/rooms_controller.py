from fastapi import APIRouter, HTTPException, Query, Depends, status
from typing import List, Optional
from room.room import Room, RoomDocument, RoomResponse, TYPE
from bson import ObjectId
from auth.permissions import (
    require_room_permission, 
    CRUDOperation
)
from user.User import UserDocument

router = APIRouter()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_room(
    room_data: Room,
    current_user: UserDocument = Depends(require_room_permission(CRUDOperation.CREATE))
):
    """Create a new room - Requires SUPER_ADMIN or HOTEL_ADMIN role"""
    try:
        room = RoomDocument(**room_data.model_dump())
        await room.insert()
        return {
            "message": "Room created successfully", 
            "id": str(room.id),
            "created_by": current_user.full_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating room: {str(e)}")

@router.get("/", response_model=List[RoomResponse])
async def get_all_rooms():
    """Get all rooms - Public access (no authentication required)"""
    try:
        rooms = await RoomDocument.find_all().to_list()
        room_responses = []
        for room in rooms:
            room_responses.append(RoomResponse(
                id=str(room.id),
                room_number=room.room_number,
                hotel_id=str(room.hotel_id) if room.hotel_id else None,
                type_name=room.type_name,
                description=room.description,
                max_occupancy=room.max_occupancy,
                price_per_night=room.price_per_night
            ))
        return room_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching rooms: {str(e)}")

@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(room_id: str):
    """Get a room by ID - Public access (no authentication required)"""
    try:
        if not ObjectId.is_valid(room_id):
            raise HTTPException(status_code=400, detail="Invalid room ID format")
        
        room = await RoomDocument.get(ObjectId(room_id))
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        return RoomResponse(
            id=str(room.id),
            room_number=room.room_number,
            hotel_id=str(room.hotel_id) if room.hotel_id else None,
            type_name=room.type_name,
            description=room.description,
            max_occupancy=room.max_occupancy,
            price_per_night=room.price_per_night
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching room: {str(e)}")

@router.patch("/{room_id}", response_model=dict)
async def update_room(
    room_id: str, 
    room_data: Room,
    current_user: UserDocument = Depends(require_room_permission(CRUDOperation.UPDATE))
):
    """Update a room - Requires SUPER_ADMIN or HOTEL_ADMIN role"""
    try:
        if not ObjectId.is_valid(room_id):
            raise HTTPException(status_code=400, detail="Invalid room ID format")
        
        room = await RoomDocument.get(ObjectId(room_id))
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        update_data = room_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(room, key, value)
        
        await room.save()
        return {
            "message": "Room updated successfully",
            "updated_by": current_user.full_name
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating room: {str(e)}")

@router.delete("/{room_id}", response_model=dict)
async def delete_room(
    room_id: str,
    current_user: UserDocument = Depends(require_room_permission(CRUDOperation.DELETE))
):
    """Delete a room - Requires SUPER_ADMIN role only"""
    try:
        if not ObjectId.is_valid(room_id):
            raise HTTPException(status_code=400, detail="Invalid room ID format")
        
        room = await RoomDocument.get(ObjectId(room_id))
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        await room.delete()
        return {
            "message": "Room deleted successfully",
            "deleted_by": current_user.full_name
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting room: {str(e)}")

@router.get("/hotel/{hotel_id}", response_model=List[RoomResponse])
async def get_rooms_by_hotel(hotel_id: str):
    """Get rooms by hotel ID - Public access (no authentication required)"""
    try:
        if not ObjectId.is_valid(hotel_id):
            raise HTTPException(status_code=400, detail="Invalid hotel ID format")
        
        rooms = await RoomDocument.find({"hotel_id": ObjectId(hotel_id)}).to_list()
        room_responses = []
        for room in rooms:
            room_responses.append(RoomResponse(
                id=str(room.id),
                room_number=room.room_number,
                hotel_id=str(room.hotel_id) if room.hotel_id else None,
                type_name=room.type_name,
                description=room.description,
                max_occupancy=room.max_occupancy,
                price_per_night=room.price_per_night
            ))
        return room_responses
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching rooms for hotel: {str(e)}")

@router.get("/type/{room_type}", response_model=List[RoomResponse])
async def get_rooms_by_type(room_type: TYPE):
    try:
        rooms = await RoomDocument.find({"type_name": room_type}).to_list()
        room_responses = []
        for room in rooms:
            room_responses.append(RoomResponse(
                id=str(room.id),
                room_number=room.room_number,
                hotel_id=str(room.hotel_id) if room.hotel_id else None,
                type_name=room.type_name,
                description=room.description,
                max_occupancy=room.max_occupancy,
                price_per_night=room.price_per_night
            ))
        return room_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching rooms by type: {str(e)}")

@router.get("/search/by-hotel-and-type", response_model=List[RoomResponse])
async def get_rooms_by_hotel_and_type(
    hotel_id: str = Query(..., description="ID of the hotel"),
    room_type: Optional[TYPE] = Query(None, description="Type of room")
):
    """
    Get rooms by hotel ID and optionally filter by room type
    """
    try:
        if not ObjectId.is_valid(hotel_id):
            raise HTTPException(status_code=400, detail="Invalid hotel ID format")
            
        query = {"hotel_id": ObjectId(hotel_id)}
        
        if room_type:
            query["type_name"] = room_type
            
        rooms = await RoomDocument.find(query).to_list()
        room_responses = []
        for room in rooms:
            room_responses.append(RoomResponse(
                id=str(room.id),
                room_number=room.room_number,
                hotel_id=str(room.hotel_id) if room.hotel_id else None,
                type_name=room.type_name,
                description=room.description,
                max_occupancy=room.max_occupancy,
                price_per_night=room.price_per_night
            ))
        return room_responses
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching rooms: {str(e)}")
