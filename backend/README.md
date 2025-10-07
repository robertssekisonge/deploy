# Project Structure

This project has been reorganized into separate frontend and backend directories for better organization and maintainability.

## Directory Structure

```
MINE/
├── frontend/           # Frontend React/TypeScript application
│   ├── src/           # React source code
│   ├── index.html     # Main HTML file
│   ├── package.json   # Frontend dependencies
│   └── ...           # Frontend configuration files
├── backend/           # Backend Node.js/Express application
│   ├── src/          # Backend source code
│   ├── prisma/       # Database schema and migrations
│   ├── package.json  # Backend dependencies
│   └── ...          # Backend configuration files
└── README.md         # This file
```

## Frontend

The frontend is a React/TypeScript application with Vite as the build tool.

### Key Features:
- React with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Component-based architecture

### To run the frontend:
```bash
cd frontend
npm install
npm run dev
```

## Backend

The backend is a Node.js/Express application with Prisma as the ORM.

### Key Features:
- Express.js server
- Prisma ORM for database management
- TypeScript support
- Authentication system
- API endpoints for various features

### To run the backend:
```bash
cd backend
npm install
npm run dev
```

## Environment Variables

The `.env` file is no longer blocked by gitignore and can be used for environment-specific configuration.

## Development

1. Start the backend server first
2. Start the frontend development server
3. Access the application through the frontend URL (typically http://localhost:5173)

# Photo Upload Routes

## What You Can Do
Upload different types of photos for students and users:

- **Student Profile Picture** - Upload a profile photo for a student
- **Family Picture** - Upload a family photo for a student  
- **Passport Picture** - Upload a passport photo for a student
- **User Profile Picture** - Upload a profile photo for a user

## How It Works
1. Send a POST request with the photo data (base64 encoded)
2. Photo gets saved to the uploads folder
3. Database gets updated with the photo filename
4. You get back the photo URL and success status

## Routes
- `POST /api/photos/student-profile/:studentId` - Student profile picture
- `POST /api/photos/family/:studentId` - Family picture
- `POST /api/photos/passport/:studentId` - Passport picture
- `POST /api/photos/profile/:userId` - User profile picture

That's it! Simple photo uploads with automatic file handling and database updates.
