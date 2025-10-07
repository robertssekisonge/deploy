# Backend Setup Instructions for Attendance System

## Quick Fix for Attendance System

The attendance system is currently failing to save to the backend. Here's how to fix it:

### 1. Start the Backend Server

Navigate to the backend directory and start the server:

```bash
cd MINE/backend
npm start
```

Or if you have specific scripts:

```bash
npm run dev
# or
npm run start
```

### 2. Check Backend Port

The frontend is trying to connect to `http://localhost:5000`. Make sure your backend is running on port 5000.

If your backend runs on a different port, update the URL in:
- `MINE/frontend/src/components/attendance/AttendanceManagement.tsx`
- `MINE/frontend/src/contexts/DataContext.tsx`

### 3. Verify Database Connection (PostgreSQL)

Set `DATABASE_URL` in `backend/.env` to your PostgreSQL instance, for example:

```
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/edusystem?schema=public"
PORT=5000
```

Then run Prisma commands:

```
npm run prisma:generate
# or: npx prisma generate
npm run prisma:migrate
# or: npx prisma migrate dev --name init_postgres
```

### 4. Check Console for Errors

Open your browser's developer console to see detailed error messages about what's failing.

## Current Status

The system now has:
- ✅ **Fallback mechanism** - if backend fails, attendance is saved locally
- ✅ **Better error messages** - shows exactly what went wrong
- ✅ **Backend health indicator** - shows if backend is online/offline
- ✅ **Detailed logging** - helps diagnose connection issues

## What Happens Now

1. **If backend is working**: Attendance saves normally to database
2. **If backend fails**: Attendance saves locally with a temporary message
3. **Dashboard shows real numbers** from either backend or local storage
4. **No data loss** - everything is preserved

## Next Steps

1. Start your backend server
2. Check the backend status indicator in the attendance page
3. Try marking attendance again
4. Check console for any remaining errors

The system will automatically detect when the backend comes back online and start using it again.







