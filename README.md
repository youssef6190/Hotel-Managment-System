# 🏨 Hotel Management System

A comprehensive hotel management system built with **FastAPI** (Python) for the backend and **Next.js** (React/TypeScript) for the frontend. This system provides complete hotel operations management including reservations, room management, user authentication, and payment processing.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [Project Structure](#project-structure)
- [Development](#development)
- [Contributing](#contributing)

## ✨ Features

### 🎯 Core Functionality
- **User Management**: Registration, authentication, and role-based access control
- **Hotel Management**: Create, update, and manage hotel properties
- **Room Management**: Manage room types, availability, and pricing
- **Reservation System**: Book rooms with inventory management
- **Payment Processing**: Handle booking payments and transactions
- **Availability Tracking**: Real-time room availability management

### 👥 User Roles
- **Viewer**: Basic user with viewing permissions
- **Hotel Admin**: Manage specific hotels (validated via tax number)
- **Super Admin**: Full system administration capabilities

### 🏢 Hotel Features
- Hotel profile management with gallery and amenities
- Location tracking (country/city with optional coordinates)
- Amenities tracking (GYM, SPA, WiFi, Parking, Pool count)
- Working hours and reservation limits configuration

## 🛠 Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **MongoDB** - NoSQL database with Beanie ODM
- **Pydantic** - Data validation and settings management
- **JWT Authentication** - Secure token-based authentication
- **Uvicorn** - Lightning-fast ASGI server

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons & Lucide React** - Beautiful icon libraries
- **React Context** - State management for authentication

### Database
- **MongoDB Atlas** - Cloud-hosted MongoDB database
- **Beanie** - Async Python ODM for MongoDB

## 🏗 Architecture

The system follows a **microservices-inspired modular architecture**:

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │
│   (Next.js)     │◄──►│   (FastAPI)     │
└─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   MongoDB       │
                       │   (Atlas)       │
                       └─────────────────┘
```

### Backend Modules
- `auth/` - Authentication and authorization
- `user/` - User management
- `hotel/` - Hotel operations
- `room/` - Room management
- `reservation/` - Booking system
- `availability/` - Inventory management
- `payment/` - Payment processing

## 🚀 Getting Started

### Prerequisites
- **Python 3.8+**
- **Node.js 18+**
- **MongoDB Atlas account** (or local MongoDB)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/youssef6190/Hotel-Managment-System.git
   cd Hotel-Managment-System
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

### Configuration

1. **Backend Configuration**
   - Update `backend/app/config.py` with your MongoDB connection string
   - Configure JWT settings in `backend/app/token_config.py`

2. **Database Setup**
   - Ensure MongoDB Atlas cluster is running
   - The application will automatically initialize collections on startup

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
   Backend will be available at: `http://localhost:9000`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will be available at: `http://localhost:3000`

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:
- **Swagger UI**: `http://localhost:9000/docs`
- **ReDoc**: `http://localhost:9000/redoc`

### Key API Endpoints

```
Authentication:
POST /auth/register        - User registration
POST /auth/login          - User login
GET  /auth/me             - Get current user

Hotels:
GET    /hotels            - List all hotels
POST   /hotels            - Create hotel (Admin only)
GET    /hotels/{id}       - Get hotel details
PUT    /hotels/{id}       - Update hotel (Admin only)

Reservations:
GET    /reservations      - List reservations
POST   /reservations      - Create reservation
GET    /reservations/{id} - Get reservation details

Rooms:
GET    /rooms             - List rooms
POST   /rooms             - Create room (Admin only)
GET    /rooms/{id}        - Get room details
```

## 🗃 Database Schema

### Core Collections

#### Users
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  age: Number,
  mobileNumber: String,
  jobType: String,
  gender: String,
  role: Enum["Viewer", "HotelAdmin", "SuperAdmin"]
}
```

#### Hotels
```javascript
{
  _id: ObjectId,
  name: String,
  contactInfo: Object,
  location: {
    country: String,
    city: String,
    coordinates: [Number] // optional
  },
  gallery: [String], // URLs
  amenities: {
    gym: Boolean,
    spa: Boolean,
    wifi: Boolean,
    parking: Boolean,
    poolCount: Number
  },
  workingHours: Object,
  maxReservationsPerDay: Number,
  taxNumber: String
}
```

#### Reservations
```javascript
{
  _id: ObjectId,
  hotelId: ObjectId,
  roomTypeId: ObjectId,
  visitorId: ObjectId,
  startTime: DateTime,
  endTime: DateTime,
  type: String, // "bed+breakfast", "all_inclusive"
  status: Enum["pending", "confirmed", "cancelled"],
  numGuests: Number,
  price: Number
}
```

## 🔐 Authentication & Authorization

### JWT-Based Authentication
- Users receive JWT tokens upon successful login
- Tokens include user role and permissions
- Protected routes validate tokens and check permissions

### Role-Based Access Control (RBAC)
- **Viewer**: Read-only access to public information
- **Hotel Admin**: Manage specific hotels (validated via tax number)
- **Super Admin**: Full system access

### Security Features
- Password hashing with bcrypt
- JWT token expiration
- CORS configuration
- Input validation with Pydantic

## 📁 Project Structure

```
Hotel-Management-System/
├── backend/
│   ├── app/
│   │   ├── auth/              # Authentication module
│   │   ├── user/              # User management
│   │   ├── hotel/             # Hotel operations
│   │   ├── room/              # Room management
│   │   ├── reservation/       # Booking system
│   │   ├── availability/      # Inventory tracking
│   │   ├── payment/           # Payment processing
│   │   ├── common_models/     # Shared models
│   │   ├── main.py           # FastAPI application
│   │   ├── config.py         # Configuration
│   │   └── database.py       # Database connection
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── app/                   # Next.js App Router
│   │   ├── admin/            # Admin pages
│   │   ├── dashboard/        # User dashboard
│   │   ├── hotels/           # Hotel browsing
│   │   ├── login/            # Authentication
│   │   └── ...
│   ├── components/           # Reusable components
│   ├── contexts/             # React contexts
│   ├── lib/                  # Utility functions
│   ├── public/               # Static assets
│   └── package.json          # Node dependencies
├── Schema.txt                # Database schema documentation
└── README.md                 # This file
```

## 🛠 Development

### Backend Development
```bash
cd backend
uvicorn main:app --reload
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Code Quality
- **Backend**: Follow PEP 8 Python style guide
- **Frontend**: ESLint configuration included
- **TypeScript**: Strict type checking enabled

### Testing
- Backend tests can be run with pytest (test files to be added)
- Frontend testing with Jest/React Testing Library (to be configured)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add appropriate comments and documentation
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team

---

**Built with ❤️ for efficient hotel management**