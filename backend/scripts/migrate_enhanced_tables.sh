#!/bin/bash

# Database Migration Script for Enhanced Tables
# This script adds the new tables for photos, conduct notes, and resources

echo "🚀 Starting database migration for enhanced file management..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 -U postgres; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Run the migration SQL
echo "📝 Running migration SQL..."
psql -h localhost -U postgres -d SMS -f backend/prisma/migration_enhanced_tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📋 New tables created:"
    echo "   - StudentPhoto (for student photos)"
    echo "   - ConductNote (for structured conduct notes)"
    echo "   - ResourceFile (enhanced resource management)"
    echo "   - StudentDocument (for student documents)"
    echo "   - TeacherResource (for teacher resources)"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Update your Prisma schema with the new models"
    echo "   2. Run 'npx prisma generate' to update the Prisma client"
    echo "   3. Restart your backend server"
    echo "   4. Test the new file management features"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
