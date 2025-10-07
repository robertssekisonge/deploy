# School Management System Backup Script
# Author: Roberts Sekisonge
# Email: robertssekisonge1147@gmail.com

Write-Host "💾 School Management System Backup Script" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Create backup directory with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "backup_$timestamp"
Write-Host "📁 Creating backup directory: $backupDir" -ForegroundColor Yellow

# Create backup directory
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Copy important files and directories
Write-Host "📋 Backing up project files..." -ForegroundColor Yellow

# Copy source code (excluding node_modules and build files)
$excludeDirs = @("node_modules", "dist", "build", ".git", "backup_*")
$includeFiles = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.json", "*.md", "*.prisma", "*.sql")

Get-ChildItem -Path "." -Recurse | Where-Object {
    $isExcluded = $false
    foreach ($excludeDir in $excludeDirs) {
        if ($_.FullName -like "*\$excludeDir*") {
            $isExcluded = $true
            break
        }
    }
    
    if (-not $isExcluded) {
        $isIncluded = $false
        foreach ($includeFile in $includeFiles) {
            if ($_.Name -like $includeFile) {
                $isIncluded = $true
                break
            }
        }
        $isIncluded
    }
} | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
    $backupPath = Join-Path $backupDir $relativePath
    $backupDirPath = Split-Path $backupPath -Parent
    
    if (-not (Test-Path $backupDirPath)) {
        New-Item -ItemType Directory -Path $backupDirPath -Force | Out-Null
    }
    
    Copy-Item $_.FullName -Destination $backupPath -Force
}

# Copy database file
Write-Host "🗄️ Backing up database..." -ForegroundColor Yellow
if (Test-Path "backend/dev.db") {
    Copy-Item "backend/dev.db" -Destination "$backupDir/backend/dev.db" -Force
    Write-Host "✅ Database backed up" -ForegroundColor Green
} else {
    Write-Host "⚠️ Database file not found" -ForegroundColor Yellow
}

# Copy environment files (if they exist)
Write-Host "🔧 Backing up configuration files..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Copy-Item ".env" -Destination "$backupDir/.env" -Force
    Write-Host "✅ Root .env backed up" -ForegroundColor Green
}

if (Test-Path "backend/.env") {
    Copy-Item "backend/.env" -Destination "$backupDir/backend/.env" -Force
    Write-Host "✅ Backend .env backed up" -ForegroundColor Green
}

# Create backup info file
$backupInfo = @"
School Management System Backup
===============================
Backup Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Backup Directory: $backupDir
Project Version: 1.0.0

Backed Up Files:
- Source code (TypeScript, React, Node.js)
- Database file (SQLite)
- Configuration files
- Documentation

To restore from this backup:
1. Copy all files from this directory to your project root
2. Run: cd backend && npm install
3. Run: npm install (from root directory)
4. Run: cd backend && npx prisma generate
5. Start the servers

Default Users:
- superadmin@school.com / password
- robs@school.com / hub h@11
- teacher1@school.com / password
- teacher2@school.com / password
- parent1@school.com / password
- nurse@school.com / password
- sponsor@school.com / password

Developer: Roberts Sekisonge
Email: robertssekisonge1147@gmail.com
"@

$backupInfo | Out-File -FilePath "$backupDir/BACKUP_INFO.txt" -Encoding UTF8

Write-Host ""
Write-Host "🎉 Backup completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "📁 Backup location: $backupDir" -ForegroundColor Cyan
Write-Host "📄 Backup info: $backupDir/BACKUP_INFO.txt" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 To create a compressed backup, run:" -ForegroundColor Yellow
Write-Host "Compress-Archive -Path '$backupDir' -DestinationPath '$backupDir.zip'" -ForegroundColor White 
# Author: Roberts Sekisonge
# Email: robertssekisonge1147@gmail.com

Write-Host "💾 School Management System Backup Script" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Create backup directory with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "backup_$timestamp"
Write-Host "📁 Creating backup directory: $backupDir" -ForegroundColor Yellow

# Create backup directory
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Copy important files and directories
Write-Host "📋 Backing up project files..." -ForegroundColor Yellow

# Copy source code (excluding node_modules and build files)
$excludeDirs = @("node_modules", "dist", "build", ".git", "backup_*")
$includeFiles = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.json", "*.md", "*.prisma", "*.sql")

Get-ChildItem -Path "." -Recurse | Where-Object {
    $isExcluded = $false
    foreach ($excludeDir in $excludeDirs) {
        if ($_.FullName -like "*\$excludeDir*") {
            $isExcluded = $true
            break
        }
    }
    
    if (-not $isExcluded) {
        $isIncluded = $false
        foreach ($includeFile in $includeFiles) {
            if ($_.Name -like $includeFile) {
                $isIncluded = $true
                break
            }
        }
        $isIncluded
    }
} | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
    $backupPath = Join-Path $backupDir $relativePath
    $backupDirPath = Split-Path $backupPath -Parent
    
    if (-not (Test-Path $backupDirPath)) {
        New-Item -ItemType Directory -Path $backupDirPath -Force | Out-Null
    }
    
    Copy-Item $_.FullName -Destination $backupPath -Force
}

# Copy database file
Write-Host "🗄️ Backing up database..." -ForegroundColor Yellow
if (Test-Path "backend/dev.db") {
    Copy-Item "backend/dev.db" -Destination "$backupDir/backend/dev.db" -Force
    Write-Host "✅ Database backed up" -ForegroundColor Green
} else {
    Write-Host "⚠️ Database file not found" -ForegroundColor Yellow
}

# Copy environment files (if they exist)
Write-Host "🔧 Backing up configuration files..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Copy-Item ".env" -Destination "$backupDir/.env" -Force
    Write-Host "✅ Root .env backed up" -ForegroundColor Green
}

if (Test-Path "backend/.env") {
    Copy-Item "backend/.env" -Destination "$backupDir/backend/.env" -Force
    Write-Host "✅ Backend .env backed up" -ForegroundColor Green
}

# Create backup info file
$backupInfo = @"
School Management System Backup
===============================
Backup Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Backup Directory: $backupDir
Project Version: 1.0.0

Backed Up Files:
- Source code (TypeScript, React, Node.js)
- Database file (SQLite)
- Configuration files
- Documentation

To restore from this backup:
1. Copy all files from this directory to your project root
2. Run: cd backend && npm install
3. Run: npm install (from root directory)
4. Run: cd backend && npx prisma generate
5. Start the servers

Default Users:
- superadmin@school.com / password
- robs@school.com / hub h@11
- teacher1@school.com / password
- teacher2@school.com / password
- parent1@school.com / password
- nurse@school.com / password
- sponsor@school.com / password

Developer: Roberts Sekisonge
Email: robertssekisonge1147@gmail.com
"@

$backupInfo | Out-File -FilePath "$backupDir/BACKUP_INFO.txt" -Encoding UTF8

Write-Host ""
Write-Host "🎉 Backup completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "📁 Backup location: $backupDir" -ForegroundColor Cyan
Write-Host "📄 Backup info: $backupDir/BACKUP_INFO.txt" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 To create a compressed backup, run:" -ForegroundColor Yellow
Write-Host "Compress-Archive -Path '$backupDir' -DestinationPath '$backupDir.zip'" -ForegroundColor White 