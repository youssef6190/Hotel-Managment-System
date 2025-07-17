from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from hotel.hotel import Hotel, HotelDocument, HotelResponse
from bson import ObjectId
from common_models.common import PydanticObjectId
from auth.permissions import (
    require_hotel_permission, 
    CRUDOperation,
    can_access_own_data
)
from user.User import Role, UserDocument

router = APIRouter()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_hotel(
    hotel_data: Hotel, 
    current_user: UserDocument = Depends(require_hotel_permission(CRUDOperation.CREATE))
):
    """Create a new hotel - Requires SUPER_ADMIN or HOTEL_ADMIN role"""
    try:
        hotel_data.admin_id = current_user.id if current_user.role == Role.HOTEL_ADMIN else None
        hotel_doc = HotelDocument(**hotel_data.model_dump())
        await hotel_doc.insert()
        return {
            "message": "Hotel created successfully", 
            "id": str(hotel_doc.id),
            "created_by": current_user.full_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating hotel: {str(e)}")

@router.get("/", response_model=List[HotelResponse])
async def get_all_hotels():
    """Get all hotels - Public access (no authentication required)"""
    try:
        hotels = await HotelDocument.find_all().to_list()
        # Convert each hotel document to response model
        hotel_responses = []
        for hotel in hotels:
            hotel_data = hotel.model_dump()
            hotel_data["id"] = str(hotel.id)
            hotel_responses.append(HotelResponse(**hotel_data))
        return hotel_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching hotels: {str(e)}")

@router.get("/admin", response_model=List[HotelResponse])
async def get_hotels_for_admin(
    current_user: UserDocument = Depends(require_hotel_permission(CRUDOperation.READ))
):
    """Get hotels for the current admin - Returns hotels where admin_id matches current user ID"""
    try:
        # For SUPER_ADMIN, return all hotels
        if current_user.role == "SUPER_ADMIN":
            hotels = await HotelDocument.find_all().to_list()
        else:
            # For HOTEL_ADMIN, return only hotels they manage
            user_object_id = current_user.id
            hotels = await HotelDocument.find({"admin_id": user_object_id}).to_list()
        
        # Convert each hotel document to response model
        hotel_responses = []
        for hotel in hotels:
            hotel_data = hotel.model_dump()
            hotel_data["id"] = str(hotel.id)
            hotel_responses.append(HotelResponse(**hotel_data))
        return hotel_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching admin hotels: {str(e)}")

@router.get("/{hotel_id}", response_model=HotelResponse)
async def get_hotel(hotel_id: str):
    """Get a hotel by ID - Public access (no authentication required)"""
    try:
        if not ObjectId.is_valid(hotel_id):
            raise HTTPException(status_code=400, detail="Invalid hotel ID format")
        
        hotel = await HotelDocument.get(ObjectId(hotel_id))
        if not hotel:
            raise HTTPException(status_code=404, detail="Hotel not found")
        
        # Convert hotel document to response model
        hotel_data = hotel.model_dump()
        hotel_data["id"] = str(hotel.id)
        return HotelResponse(**hotel_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching hotel: {str(e)}")

@router.patch("/{hotel_id}", response_model=dict)
async def update_hotel(
    hotel_id: str, 
    hotel_data: Hotel,
    current_user: UserDocument = Depends(require_hotel_permission(CRUDOperation.UPDATE))
):
    """Update a hotel by ID - Requires SUPER_ADMIN or HOTEL_ADMIN role"""
    try:
        if not ObjectId.is_valid(hotel_id):
            raise HTTPException(status_code=400, detail="Invalid hotel ID format")
        
        hotel = await HotelDocument.get(ObjectId(hotel_id))
        if not hotel:
            raise HTTPException(status_code=404, detail="Hotel not found")
        
        # Update the hotel with new data
        hotel_dict = hotel_data.model_dump(exclude_unset=True)
        for key, value in hotel_dict.items():
            setattr(hotel, key, value)
        
        await hotel.save()
        return {
            "message": "Hotel updated successfully",
            "updated_by": current_user.full_name
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating hotel: {str(e)}")

@router.delete("/{hotel_id}", response_model=dict)
async def delete_hotel(
    hotel_id: str,
    current_user: UserDocument = Depends(require_hotel_permission(CRUDOperation.DELETE))
):
    """Delete a hotel by ID - Requires SUPER_ADMIN role only"""
    try:
        if not ObjectId.is_valid(hotel_id):
            raise HTTPException(status_code=400, detail="Invalid hotel ID format")
        
        hotel = await HotelDocument.get(ObjectId(hotel_id))
        if not hotel:
            raise HTTPException(status_code=404, detail="Hotel not found")
        
        await hotel.delete()
        return {
            "message": "Hotel deleted successfully",
            "deleted_by": current_user.full_name
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting hotel: {str(e)}")

@router.get("/search/", response_model=List[HotelResponse])
async def search_hotels(
    name: Optional[str] = None, 
    country: Optional[str] = None, 
    city: Optional[str] = None,
    destination: Optional[str] = None
):
    """Search hotels by name, country, city, or general destination - Public access (no authentication required)"""
    try:
        query = {}
        
        # Individual field searches
        if name:
            query["name"] = {"$regex": name, "$options": "i"}  # Case-insensitive search
        if country:
            query["location.country"] = {"$regex": country, "$options": "i"}
        if city:
            query["location.city"] = {"$regex": city, "$options": "i"}
        
        # General destination search - search across multiple fields
        if destination and not any([name, country, city]):
            # Split destination by common separators and clean up
            destination_parts = [part.strip() for part in destination.replace(',', ' ').split() if part.strip()]
            
            # Create search queries for each part and the full string
            search_queries = []
            
            # Search for the full destination string
            search_queries.extend([
                {"name": {"$regex": destination, "$options": "i"}},
                {"location.country": {"$regex": destination, "$options": "i"}},
                {"location.city": {"$regex": destination, "$options": "i"}}
            ])
            
            # Search for each part of the destination
            for part in destination_parts:
                if len(part) > 1:  # Skip single characters
                    search_queries.extend([
                        {"name": {"$regex": part, "$options": "i"}},
                        {"location.country": {"$regex": part, "$options": "i"}},
                        {"location.city": {"$regex": part, "$options": "i"}}
                    ])
            
            destination_query = {"$or": search_queries}
            query.update(destination_query)
        
        hotels = await HotelDocument.find(query).to_list()
        
        # Convert to response format with IDs
        hotel_responses = []
        for hotel in hotels:
            hotel_data = hotel.model_dump()
            hotel_data["id"] = str(hotel.id)
            hotel_responses.append(HotelResponse(**hotel_data))
        
        return hotel_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching hotels: {str(e)}")
