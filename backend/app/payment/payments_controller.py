from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from payment.payment import Payment, PaymentDocument, Status
from bson import ObjectId
from auth.permissions import (
    require_payment_permission, 
    CRUDOperation,
    can_access_own_data
)
from user.User import UserDocument
from auth.auth import get_current_user

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

@router.get("/", response_model=List[Payment])
async def get_all_payments(
    current_user: UserDocument = Depends(require_payment_permission(CRUDOperation.READ))
):
    """Get all payments - Requires SUPER_ADMIN or HOTEL_ADMIN role"""
    try:
        payments = await PaymentDocument.find_all().to_list()
        return payments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payments: {str(e)}")

@router.get("/{payment_id}", response_model=Payment)
async def get_payment(payment_id: str):
    try:
        payment = await PaymentDocument.get(ObjectId(payment_id))
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        return payment
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payment: {str(e)}")

@router.patch("/{payment_id}", response_model=dict)
async def update_payment(payment_id: str, payment_data: Payment):
    try:
        payment = await PaymentDocument.get(ObjectId(payment_id))
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        update_data = payment_data.dict(exclude_unset=True)
        for key, value in update_data.items():
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

@router.get("/reservation/{reservation_id}", response_model=List[Payment])
async def get_payments_by_reservation(reservation_id: str):
    try:
        payments = await PaymentDocument.find({"reservation_id": ObjectId(reservation_id)}).to_list()
        return payments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payments for reservation: {str(e)}")

@router.get("/user/{user_id}", response_model=List[Payment])
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
        return payments
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user payments: {str(e)}")

@router.get("/my-payments", response_model=List[Payment])
async def get_my_payments(
    current_user: UserDocument = Depends(get_current_user)
):
    """Get all payments for the current authenticated user - Used for guests to see their own payments"""
    try:
        payments = await PaymentDocument.find({"user_id": current_user.id}).to_list()
        return payments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching your payments: {str(e)}")
