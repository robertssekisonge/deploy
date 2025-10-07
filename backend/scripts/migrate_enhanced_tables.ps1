# Database Migration Script for Enhanced Tables (PowerShell)
# This script adds the new tables for photos, conduct notes, and resources

Write-Host "🚀 Starting database migration for enhanced file management..." -ForegroundColor Green

# Check if PostgreSQL is running
try {
    $pgTest = & psql -h localhost -U postgres -d SMS -c "SELECT 1;" 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL connection failed"
    }
} catch {
    Write-Host "❌ PostgreSQL is not running or not accessible. Please start PostgreSQL first." -ForegroundColor Red
    exit 1
}

# Run the migration SQL
Write-Host "📝 Running migration SQL..." -ForegroundColor Yellow

try {
    & psql -h localhost -U postgres -d SMS -f "backend/prisma/migration_enhanced_tables.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 New tables created:" -ForegroundColor Cyan
        Write-Host "   - StudentPhoto (for student photos)" -ForegroundColor White
        Write-Host "   - ConductNote (for structured conduct notes)" -ForegroundColor White
        Write-Host "   - ResourceFile (enhanced resource management)" -ForegroundColor White
        Write-Host "   - StudentDocument (for student documents)" -ForegroundColor White
        Write-Host "   - TeacherResource (for teacher resources)" -ForegroundColor White
        Write-Host ""
        Write-Host "🔧 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Update your Prisma schema with the new models" -ForegroundColor White
        Write-Host "   2. Run 'npx prisma generate' to update the Prisma client" -ForegroundColor White
        Write-Host "   3. Restart your backend server" -ForegroundColor White
        Write-Host "   4. Test the new file management features" -ForegroundColor White
    } else {
        throw "Migration failed"
    }
} catch {
    Write-Host "❌ Migration failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}
