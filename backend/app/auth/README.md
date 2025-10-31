# Custom Bearer Token Authentication

This module provides a custom implementation of JWT (JSON Web Token) authentication for the Hotel Management System using Bearer tokens without OAuth2.

## Features

- Secure JWT-based authentication
- Custom Bearer token extraction from headers
- Role-based access control
- Token refresh mechanism
- Password hashing with bcrypt

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# JWT Settings
JWT_SECRET_KEY=your_secure_secret_key_here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

## API Endpoints

### Authentication

- `POST /auth/login` - Login endpoint to get a JWT token
- `GET /auth/me` - Get current user information
- `POST /auth/refresh` - Refresh access token

## Client Usage

Example of how to use the authentication from a client:

```python
import requests

# Login to get token
login_data = {
    "email": "user@example.com",
    "password": "password123"
}
response = requests.post("http://localhost:9000/auth/login", json=login_data)
token = response.json()["access_token"]

# Use token in subsequent requests
headers = {
    "Authorization": f"Bearer {token}"
}
user_info = requests.get("http://localhost:9000/auth/me", headers=headers)
```

## Backend Usage

To protect an endpoint with authentication:

```python
@router.get("/protected-endpoint")
async def protected_endpoint(current_user: UserDocument = Depends(get_current_user)):
    # Your code here
    return {"message": "This endpoint is protected"}
```

To restrict access by role:

```python
@router.get("/admin-only", dependencies=[Depends(has_role([Role.SUPER_ADMIN]))])
async def admin_only():
    # Your code here
    return {"message": "Admin access only"}
```

## Testing

You can run the provided test script to verify the authentication system:

```
python -m app.auth.test_auth
```

## Required Packages

- python-jose
- passlib
- bcrypt
- requests (for testing) 