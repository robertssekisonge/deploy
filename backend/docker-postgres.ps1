# PostgreSQL Docker Setup Script
Write-Host "Setting up PostgreSQL using Docker..." -ForegroundColor Green

# Check if Docker is installed
try {
    docker --version
    Write-Host "Docker is installed!" -ForegroundColor Green
} catch {
    Write-Host "Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Create a Docker network for the database
Write-Host "Creating Docker network..." -ForegroundColor Yellow
docker network create school-network 2>$null

# Run PostgreSQL container
Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
docker run -d `
    --name school-postgres `
    --network school-network `
    -e POSTGRES_DB=schooldb `
    -e POSTGRES_USER=postgres `
    -e POSTGRES_PASSWORD="hub h" `
    -p 5432:5432 `
    postgres:15

Write-Host "PostgreSQL is now running on localhost:5432" -ForegroundColor Green
Write-Host "Database: schooldb" -ForegroundColor Green
Write-Host "Username: postgres" -ForegroundColor Green
Write-Host "Password: hub h" -ForegroundColor Green

Write-Host "You can now run the database setup commands in the backend directory." -ForegroundColor Yellow 