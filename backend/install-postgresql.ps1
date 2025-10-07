# PostgreSQL Installation Script
Write-Host "Installing PostgreSQL..." -ForegroundColor Green

# Download PostgreSQL installer
$postgresUrl = "https://get.enterprisedb.com/postgresql/postgresql-15.5-1-windows-x64.exe"
$installerPath = "$env:TEMP\postgresql-installer.exe"

Write-Host "Downloading PostgreSQL installer..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $postgresUrl -OutFile $installerPath

Write-Host "Installing PostgreSQL..." -ForegroundColor Yellow
# Install PostgreSQL with silent installation
Start-Process -FilePath $installerPath -ArgumentList "--unattendedmodeui minimal --mode unattended --superpassword `"hub h`" --serverport 5432 --servicename postgresql-x64-15 --serviceaccount postgres --superaccount postgres" -Wait

Write-Host "PostgreSQL installation completed!" -ForegroundColor Green
Write-Host "Please restart your terminal and then run the database setup commands." -ForegroundColor Yellow 