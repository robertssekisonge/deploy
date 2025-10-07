# Comprehensive Database Setup Script
Write-Host "=== School Management System Database Setup ===" -ForegroundColor Cyan

# Function to check if PostgreSQL is running
function Test-PostgreSQL {
    try {
        $result = Invoke-WebRequest -Uri "http://localhost:5432" -TimeoutSec 5 -ErrorAction SilentlyContinue
        return $true
    } catch {
        return $false
    }
}

# Function to check if psql is available
function Test-PSQL {
    try {
        $null = Get-Command psql -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow

if (Test-PSQL) {
    Write-Host "PostgreSQL is installed!" -ForegroundColor Green
} else {
    Write-Host "PostgreSQL is not installed. Please install PostgreSQL first." -ForegroundColor Red
    Write-Host "You can:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "2. Use Docker: docker run -d --name school-postgres -e POSTGRES_DB=schooldb -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=`"hub h`" -p 5432:5432 postgres:15" -ForegroundColor Yellow
    Write-Host "3. Run the docker-postgres.ps1 script" -ForegroundColor Yellow
    exit 1
}

# Check if PostgreSQL service is running
Write-Host "Checking if PostgreSQL service is running..." -ForegroundColor Yellow
$service = Get-Service -Name "*postgres*" -ErrorAction SilentlyContinue

if ($service -and $service.Status -eq "Running") {
    Write-Host "PostgreSQL service is running!" -ForegroundColor Green
} else {
    Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
    try {
        Start-Service -Name "*postgres*" -ErrorAction Stop
        Write-Host "PostgreSQL service started!" -ForegroundColor Green
    } catch {
        Write-Host "Failed to start PostgreSQL service. Please start it manually." -ForegroundColor Red
        exit 1
    }
}

# Wait a moment for the service to fully start
Start-Sleep -Seconds 3

# Test database connection
Write-Host "Testing database connection..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "hub h"
    $testResult = psql -h localhost -U postgres -d postgres -c "SELECT version();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database connection successful!" -ForegroundColor Green
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Host "Database connection failed. Please check your PostgreSQL installation." -ForegroundColor Red
    Write-Host "Make sure the password is set to 'hub h'" -ForegroundColor Yellow
    exit 1
}

# Create the database
Write-Host "Creating schooldb database..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "hub h"
    psql -h localhost -U postgres -c "CREATE DATABASE schooldb;" 2>$null
    Write-Host "Database 'schooldb' created successfully!" -ForegroundColor Green
} catch {
    Write-Host "Database might already exist, continuing..." -ForegroundColor Yellow
}

# Navigate to backend directory and set up Prisma
Write-Host "Setting up Prisma schema..." -ForegroundColor Yellow
Set-Location backend

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Push the schema to the database
Write-Host "Pushing schema to database..." -ForegroundColor Yellow
npx prisma db push

Write-Host "=== Database setup completed successfully! ===" -ForegroundColor Green
Write-Host "You can now start the backend server with: npm run dev" -ForegroundColor Yellow 