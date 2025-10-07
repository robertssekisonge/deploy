# Quick Setup Script for School Management System
Write-Host "=== School Management System Quick Setup ===" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "backend")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
npm install

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
cd backend
npm install

Write-Host "🔧 Setting up database..." -ForegroundColor Yellow

# Check if .env exists, if not create it
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
DATABASE_URL="postgresql://postgres:hub h@localhost:5432/schooldb"
PORT=5000
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NODE_ENV="development"
"@ | Out-File -FilePath .env -Encoding UTF8
}

Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "🗄️ Setting up database schema..." -ForegroundColor Yellow
npx prisma db push

Write-Host "🌱 Seeding database with sample data..." -ForegroundColor Yellow
npm run seed

Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To start the application:" -ForegroundColor Cyan
Write-Host "1. Start the backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "2. Start the frontend: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📊 Default login credentials:" -ForegroundColor Cyan
Write-Host "   Admin: admin@school.com / admin123" -ForegroundColor White
Write-Host "   Teacher: teacher@school.com / teacher123" -ForegroundColor White
Write-Host "   Student: student@school.com / student123" -ForegroundColor White
Write-Host "   Parent: parent@school.com / parent123" -ForegroundColor White 