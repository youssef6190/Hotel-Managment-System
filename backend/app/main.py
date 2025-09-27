from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from database import initiate_database
from user import users_controller
from availability import availability_controller
from hotel import hotels_controller
from payment import payments_controller
from reservation import reservations_controller
from room import rooms_controller
from auth import auth_controller
from auth.auth import security

app = FastAPI(
    title="Hotel Management System API",
    description="API for Hotel Management System",
    version="1.0.0",
    swagger_ui_parameters={"persistAuthorization": True},
    debug=True
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify the actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OpenAPI (Swagger UI)
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Define the security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer Authentication": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter JWT token"
        }
    }
    
    # Apply security to all endpoints except /auth/token and /auth/login
    openapi_schema["security"] = [{"Bearer Authentication": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

@app.on_event("startup")
async def on_startup():
    await initiate_database()


# Include the routers
app.include_router(auth_controller.router, prefix="/auth", tags=["Authentication"])  # add the auth router
app.include_router(hotels_controller.router, prefix="/hotels", tags=["Hotels"]) # add the hotels router
app.include_router(users_controller.router, prefix="/users", tags=["Users"]) # add the users router
app.include_router(payments_controller.router, prefix="/payments", tags=["Payments"]) # add the payments router
app.include_router(rooms_controller.router, prefix="/rooms", tags=["Rooms"]) # add the rooms router
app.include_router(availability_controller.router, prefix="/availability", tags=["Availability"]) # add the availability router
app.include_router(reservations_controller.router, prefix="/reservations", tags=["Reservations"]) # add the reservations router

