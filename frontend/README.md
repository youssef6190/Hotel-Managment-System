# Travio - Frontend

This is the frontend application for Travio, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Authentication System**: Complete login and registration functionality
- **Protected Routes**: Dashboard and user-specific pages require authentication
- **Responsive Design**: Mobile-friendly UI using Tailwind CSS
- **Backend Integration**: Connected to FastAPI backend for user management and hotel data

## Pages

- **Home Page** (`/`): Landing page with hero section and features
- **Login Page** (`/login`): User authentication
- **Register Page** (`/register`): New user registration
- **Dashboard** (`/dashboard`): Protected user dashboard (requires login)
- **Hotels** (`/hotels`): Browse available hotels

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.local.example .env.local
```

3. Update environment variables in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint
```

The application will be available at `http://localhost:3000`.

## Authentication Flow

1. **Registration**: Users can create new accounts at `/register`
2. **Login**: Users authenticate at `/login` 
3. **Token Storage**: JWT tokens are stored in localStorage
4. **Protected Routes**: Dashboard and other protected pages require authentication
5. **Auto-redirect**: Unauthenticated users are redirected to login

## Backend API Integration

The frontend connects to the FastAPI backend with the following endpoints:

- `POST /auth/token` - User login
- `GET /auth/me` - Get current user info
- `POST /users/register` - User registration
- `GET /hotels` - Get hotels list

## Project Structure

```
app/
├── login/page.tsx          # Login page
├── register/page.tsx       # Registration page
├── dashboard/page.tsx      # User dashboard (protected)
├── hotels/page.tsx         # Hotels listing
├── layout.tsx              # Root layout with AuthProvider
└── page.tsx                # Home page

components/
├── Header.tsx              # Navigation header
└── ProtectedRoute.tsx      # Auth guard component

contexts/
└── AuthContext.tsx         # Authentication context

lib/
└── auth.ts                 # API utilities for authentication
```

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Context**: State management for authentication
- **Fetch API**: HTTP client for backend communication
