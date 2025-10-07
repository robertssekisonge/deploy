# Installation Guide

## Step 1: Install PostgreSQL

### Option A: Download from Official Website (Recommended)

1. **Download PostgreSQL**:
   - Go to: https://www.postgresql.org/download/windows/
   - Click "Download the installer"
   - Choose the latest version (15.x or 16.x)

2. **Install PostgreSQL**:
   - Run the downloaded installer
   - **Important**: Set the password to: `hub h`
   - Keep the default port: `5432`
   - Complete the installation

3. **Verify Installation**:
   - Open Command Prompt or PowerShell
   - Run: `psql --version`
   - You should see the PostgreSQL version

### Option B: Using Chocolatey (if you have it installed)

```powershell
choco install postgresql
```

### Option C: Using Docker

1. **Install Docker Desktop**:
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and restart your computer

2. **Run PostgreSQL in Docker**:
   ```powershell
   docker run -d --name school-postgres -e POSTGRES_DB=schooldb -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD="hub h" -p 5432:5432 postgres:15
   ```

## Step 2: Install Node.js

1. **Download Node.js**:
   - Go to: https://nodejs.org/
   - Download the LTS version (18.x or higher)

2. **Verify Installation**:
   ```powershell
   node --version
   npm --version
   ```

## Step 3: Set Up the Project

1. **Clone or download the project** (if you haven't already)

2. **Run the quick setup script**:
   ```powershell
   PowerShell -ExecutionPolicy Bypass -File .\quick-setup.ps1
   ```

   Or manually:
   ```powershell
   # Install dependencies
   npm install
   cd backend
   npm install
   
   # Set up database
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

## Step 4: Start the Application

1. **Start the backend server**:
   ```powershell
   cd backend
   npm run dev
   ```
   The backend will start on `http://localhost:5000`

2. **Start the frontend** (in a new terminal):
   ```powershell
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`

## Step 5: Access the Application

1. **Open your browser** and go to: `http://localhost:5173`

2. **Login with one of these accounts**:
   - **Admin**: `admin@school.com` / `admin123`
   - **Teacher**: `teacher@school.com` / `teacher123`
   - **Student**: `student@school.com` / `student123`
   - **Parent**: `parent@school.com` / `parent123`

## Troubleshooting

### PostgreSQL Issues

1. **Service not running**:
   ```powershell
   # Check service status
   Get-Service -Name "*postgres*"
   
   # Start service
   Start-Service -Name "*postgres*"
   ```

2. **Connection refused**:
   - Make sure PostgreSQL is installed and running
   - Check if port 5432 is not used by another application
   - Verify the password is set to: `hub h`

3. **Password authentication failed**:
   - Reset the PostgreSQL password:
   ```powershell
   # Connect to PostgreSQL as superuser
   psql -U postgres
   
   # Change password
   ALTER USER postgres PASSWORD 'hub h';
   \q
   ```

### Node.js Issues

1. **Node not found**:
   - Reinstall Node.js from https://nodejs.org/
   - Make sure to check "Add to PATH" during installation

2. **npm not found**:
   - Node.js installation includes npm
   - Try restarting your terminal after installation

### Port Conflicts

1. **Port 5000 in use**:
   - Change the port in `backend/.env`:
   ```
   PORT=5001
   ```

2. **Port 5173 in use**:
   - Vite will automatically use the next available port

### Database Issues

1. **Prisma errors**:
   ```powershell
   cd backend
   npx prisma generate
   npx prisma db push
   ```

2. **Reset database**:
   ```powershell
   cd backend
   npx prisma migrate reset
   npm run seed
   ```

## Verification

To verify everything is working:

1. **Backend health check**: http://localhost:5000/api/health
2. **Database test**: http://localhost:5000/api/test-db
3. **Frontend**: http://localhost:5173

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Make sure all prerequisites are installed
3. Verify PostgreSQL is running and accessible
4. Check the console for error messages

## Next Steps

Once the application is running:

1. **Explore the features**:
   - User management
   - Student enrollment
   - Attendance tracking
   - Payment management
   - Messaging system

2. **Customize the system**:
   - Add your school's information
   - Create additional users
   - Configure settings

3. **Deploy to production**:
   - Set up a production database
   - Configure environment variables
   - Set up proper security measures 