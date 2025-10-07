# Settings Migration Script (PowerShell)
# This script adds missing columns to the Settings table

Write-Host "🚀 Starting Settings table migration..." -ForegroundColor Green

# Check if PostgreSQL is running
try {
    # Try to connect to PostgreSQL
    $env:PGPASSWORD = "postgres"
    $testQuery = "SELECT 1;" | & "C:\Program Files\PostgreSQL\15\bin\psql.exe" -h localhost -U postgres -d sms 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL connection failed"
    }
} catch {
    Write-Host "❌ PostgreSQL is not running or not accessible. Please start PostgreSQL first." -ForegroundColor Red
    Write-Host "💡 Make sure PostgreSQL is running on localhost:5432" -ForegroundColor Yellow
    Write-Host "💡 Database 'sms' should exist with user 'postgres'" -ForegroundColor Yellow
    exit 1
}

# Run the migration SQL
Write-Host "📝 Running Settings migration SQL..." -ForegroundColor Yellow

try {
    $env:PGPASSWORD = "postgres"
    & "C:\Program Files\PostgreSQL\15\bin\psql.exe" -h localhost -U postgres -d sms -f "backend/scripts/migrate_settings_columns.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Settings migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Added columns to Settings table:" -ForegroundColor Cyan
        Write-Host "   - School information fields (name, address, phone, email, etc.)" -ForegroundColor White
        Write-Host "   - Term dates (start, end, reporting date)" -ForegroundColor White
        Write-Host "   - Attendance configuration" -ForegroundColor White
        Write-Host "   - Styling and branding options" -ForegroundColor White
        Write-Host "   - Document styling fields" -ForegroundColor White
        Write-Host "   - HR/Document fields" -ForegroundColor White
        Write-Host "   - Bank details and rules" -ForegroundColor White
        Write-Host ""
        Write-Host "🔧 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Restart your backend server" -ForegroundColor White
        Write-Host "   2. Test saving school information" -ForegroundColor White
        Write-Host "   3. Verify data persists after refresh" -ForegroundColor White
    } else {
        throw "Migration failed"
    }
} catch {
    Write-Host "❌ Migration failed. Please check the error messages above." -ForegroundColor Red
    Write-Host "💡 Make sure the PostgreSQL path is correct: C:\Program Files\PostgreSQL\15\bin\psql.exe" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 Settings migration completed! Your school information should now persist properly." -ForegroundColor Green


