# Local PostgreSQL Setup Guide

Since PostgreSQL is not installed locally, here's how to set it up:

## Option 1: Install PostgreSQL (Recommended)

### Download and Install:
1. Go to https://www.postgresql.org/download/windows/
2. Download the PostgreSQL installer for Windows
3. Run the installer and follow the setup wizard
4. **Important**: Remember the password you set for the 'postgres' user

### After Installation:
1. Open Command Prompt or PowerShell
2. Test connection: `psql -U postgres`
3. Create database: `createdb school_management_system`

### Default Connection Details:
- Host: localhost
- Port: 5432
- Username: postgres
- Password: [what you set during installation]
- Database: school_management_system

## Option 2: Use Docker (Alternative)

If you have Docker installed:
```bash
docker run --name postgres-sms -e POSTGRES_PASSWORD=password -e POSTGRES_DB=school_management_system -p 5432:5432 -d postgres:15
```

## Option 3: Use SQLite for Development

If you want to proceed without PostgreSQL:
1. Change DATABASE_URL in backend/.env to: `DATABASE_URL="file:./dev.db"`
2. Change provider in prisma/schema.prisma to: `provider = "sqlite"`

## After PostgreSQL Installation:

1. Update your backend/.env file with correct credentials:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/school_management_system"
```

2. Run database migrations:
```bash
cd backend
npx prisma db push
npx prisma generate
```

3. Start your server:
```bash
npm run dev
```

## Troubleshooting:

- If you get "psql not recognized", add PostgreSQL bin directory to your PATH
- Default PostgreSQL bin location: `C:\Program Files\PostgreSQL\16\bin\`
- If connection fails, check if PostgreSQL service is running
- Service name is usually "postgresql"

Want me to help with any of these options?
