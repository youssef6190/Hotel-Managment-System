from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from payment.payment import Payment, PaymentDocument, Status
from bson import ObjectId
from auth.permissions import (
    require_payment_permission, 
    CRUDOperation,
    can_access_own_data
)
from user.User import UserDocument, Role
from auth.auth import get_current_user
from pydantic import BaseModel

class PaymentResponse(BaseModel):
    """Response model for payment data with string IDs"""
    id: str
    reservation_id: str
    user_id: str
    amount: float
    payment_method: str
    payment_status: str
    transaction_date: str

    @classmethod
    def from_document(cls, doc: PaymentDocument):
        """Convert PaymentDocument to PaymentResponse"""
        return cls(
            id=str(doc.id),
            reservation_id=str(doc.reservation_id) if doc.reservation_id else "",
            user_id=str(doc.user_id) if doc.user_id else "",
            amount=doc.amount,
            payment_method=doc.payment_method,
            payment_status=doc.payment_status.value if hasattr(doc.payment_status, 'value') else str(doc.payment_status),
            transaction_date=doc.transaction_date
        )

router = APIRouter()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_data: Payment,
    current_user: UserDocument = Depends(get_current_user)
):
    """Create a new payment - Any authenticated user can create payments"""
    try:
        # Set the user_id to the current authenticated user if not provided
        payment_dict = payment_data.model_dump()
        if "user_id" not in payment_dict or not payment_dict["user_id"]:
            payment_dict["user_id"] = current_user.id
        
        payment = PaymentDocument(**payment_dict)
        await payment.insert()
        return {
            "message": "Payment created successfully", 
            "id": str(payment.id),
            "created_by": current_user.full_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating payment: {str(e)}")

@router.get("/my-payments", response_model=List[PaymentResponse])
async def get_my_payments(
    current_user: UserDocument = Depends(get_current_user)
):
    """Get all payments for the current authenticated user - Used for guests to see their own payments"""
    try:
        payments = await PaymentDocument.find({"user_id": current_user.id}).to_list()
        return [PaymentResponse.from_document(payment) for payment in payments]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching your payments: {str(e)}")

@router.get("/my-hotel-payments", response_model=List[PaymentResponse])
async def get_my_hotel_payments(
    current_user: UserDocument = Depends(get_current_user)
):
    """Get payments for hotels managed by the current hotel admin"""
    try:
        if current_user.role != Role.HOTEL_ADMIN:
            raise HTTPException(status_code=403, detail="Access denied - Hotel admin role required")
            
        from hotel.hotel import HotelDocument
        from reservation.reservation import ReservationDocument
        
        # Get hotels managed by this admin
        admin_hotels = await HotelDocument.find({"admin_id": current_user.id}).to_list()
        hotel_ids = [hotel.id for hotel in admin_hotels]
        
        if hotel_ids:
            # Get reservations for these hotels
            reservations = await ReservationDocument.find({"hotel_id": {"$in": hotel_ids}}).to_list()
            reservation_ids = [res.id for res in reservations]
            
            # Get payments for these reservations
            payments = await PaymentDocument.find({"reservation_id": {"$in": reservation_ids}}).to_list()
        else:
            payments = []
            
        return [PaymentResponse.from_document(payment) for payment in payments]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching hotel payments: {str(e)}")

@router.get("/reservation/{reservation_id}", response_model=List[PaymentResponse])
async def get_payments_by_reservation(reservation_id: str):
    try:
        payments = await PaymentDocument.find({"reservation_id": ObjectId(reservation_id)}).to_list()
        return [PaymentResponse.from_document(payment) for payment in payments]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payments for reservation: {str(e)}")

@router.get("/user/{user_id}", response_model=List[PaymentResponse])
async def get_payments_by_user(
    user_id: str,
    current_user: UserDocument = Depends(get_current_user)
):
    """Get payments by user ID - Users can only see their own payments unless they're admin"""
    try:
        # Check if user is trying to access their own data or if they're an admin
        if current_user.id != ObjectId(user_id) and current_user.role not in ['super_admin', 'hotel_admin']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        payments = await PaymentDocument.find({"user_id": ObjectId(user_id)}).to_list()
        return [PaymentResponse.from_document(payment) for payment in payments]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user payments: {str(e)}")

@router.get("/", response_model=List[PaymentResponse])
async def get_all_payments(
    current_user: UserDocument = Depends(require_payment_permission(CRUDOperation.READ))
):
    """Get all payments - Super admins see all, hotel admins see payments for their hotels only"""
    try:
        if current_user.role == Role.SUPER_ADMIN:
            # Super admins see all payments
            payments = await PaymentDocument.find_all().to_list()
        elif current_user.role == Role.HOTEL_ADMIN:
            # Hotel admins see payments for reservations in their hotels only
            from hotel.hotel import HotelDocument
            from reservation.reservation import ReservationDocument
            
            # Get hotels managed by this admin
            admin_hotels = await HotelDocument.find({"admin_id": current_user.id}).to_list()
            hotel_ids = [hotel.id for hotel in admin_hotels]
            
            if hotel_ids:
                # Get reservations for these hotels
                reservations = await ReservationDocument.find({"hotel_id": {"$in": hotel_ids}}).to_list()
                reservation_ids = [res.id for res in reservations]
                
                # Get payments for these reservations
                payments = await PaymentDocument.find({"reservation_id": {"$in": reservation_ids}}).to_list()
            else:
                payments = []
        else:
            # Other roles shouldn't reach here due to permission check, but just in case
            payments = []
            
        return [PaymentResponse.from_document(payment) for payment in payments]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payments: {str(e)}")

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str):
    try:
        payment = await PaymentDocument.get(ObjectId(payment_id))
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        return PaymentResponse.from_document(payment)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payment: {str(e)}")

@router.patch("/{payment_id}", response_model=dict)
async def update_payment(payment_id: str, payment_data: dict):
    try:
        payment = await PaymentDocument.get(ObjectId(payment_id))
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Update only the provided fields
        for key, value in payment_data.items():
            if hasattr(payment, key):
                # Handle status enum conversion
                if key == "payment_status" and isinstance(value, str):
                    setattr(payment, key, Status(value))
                else:
                    setattr(payment, key, value)
        
        await payment.save()
        return {"message": "Payment updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating payment: {str(e)}")

@router.delete("/{payment_id}", response_model=dict)
async def delete_payment(payment_id: str):
    try:
        payment = await PaymentDocument.get(ObjectId(payment_id))
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        await payment.delete()
        return {"message": "Payment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting payment: {str(e)}")
