# School Management System Deployment Script
# Author: Roberts Sekisonge
# Email: robertssekisonge1147@gmail.com

Write-Host "🚀 School Management System Deployment Script" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if Node.js is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not available. Please install npm." -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
cd backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# Set up database
Write-Host "🗄️ Setting up database..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

npx prisma migrate dev
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run database migrations" -ForegroundColor Red
    exit 1
}

npm run seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to seed database" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database setup completed" -ForegroundColor Green

# Go back to root directory
cd ..

# Build frontend for production
Write-Host "🔨 Building frontend for production..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build frontend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the backend server: cd backend && npm run dev" -ForegroundColor White
Write-Host "2. Start the frontend server: npm run dev" -ForegroundColor White
Write-Host "3. Access the application at the URL shown in the terminal" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Default admin credentials:" -ForegroundColor Cyan
Write-Host "Email: superadmin@school.com" -ForegroundColor White
Write-Host "Password: password" -ForegroundColor White
Write-Host ""
Write-Host "📧 Your user credentials:" -ForegroundColor Cyan
Write-Host "Email: robs@school.com" -ForegroundColor White
Write-Host "Password: hub h@11" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "📱 Frontend: http://localhost:5173 (or port shown)" -ForegroundColor Cyan 
# Author: Roberts Sekisonge
# Email: robertssekisonge1147@gmail.com

Write-Host "🚀 School Management System Deployment Script" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if Node.js is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not available. Please install npm." -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
cd backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# Set up database
Write-Host "🗄️ Setting up database..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

npx prisma migrate dev
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run database migrations" -ForegroundColor Red
    exit 1
}

npm run seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to seed database" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database setup completed" -ForegroundColor Green

# Go back to root directory
cd ..

# Build frontend for production
Write-Host "🔨 Building frontend for production..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build frontend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the backend server: cd backend && npm run dev" -ForegroundColor White
Write-Host "2. Start the frontend server: npm run dev" -ForegroundColor White
Write-Host "3. Access the application at the URL shown in the terminal" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Default admin credentials:" -ForegroundColor Cyan
Write-Host "Email: superadmin@school.com" -ForegroundColor White
Write-Host "Password: password" -ForegroundColor White
Write-Host ""
Write-Host "📧 Your user credentials:" -ForegroundColor Cyan
Write-Host "Email: robs@school.com" -ForegroundColor White
Write-Host "Password: hub h@11" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "📱 Frontend: http://localhost:5173 (or port shown)" -ForegroundColor Cyan 