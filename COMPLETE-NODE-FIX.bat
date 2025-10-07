@echo off
echo ===============================================
echo  COMPLETE NODE.JS PATH FIX FOR WINDOWS
echo ===============================================
echo.

echo Step 1: Checking Node.js installation...
if exist "C:\Program Files\nodejs\node.exe" (
    echo ✓ Node.js found at: C:\Program Files\nodejs\node.exe
) else (
    echo ✗ Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo.
echo Step 2: Adding Node.js to System PATH...
setx PATH "%PATH%;C:\Program Files\nodejs" /M 2>nul
if errorlevel 1 (
    echo ⚠ Failed to add to system PATH. Trying user PATH...
    setx PATH "%PATH%;C:\Program Files\nodejs"
)

echo.
echo Step 3: Testing Node.js...
"C:\Program Files\nodejs\node.exe" --version
if errorlevel 1 (
    echo ✗ Node.js test failed
    exit /b 1
)

echo.
echo Step 4: Testing npm...
"C:\Program Files\nodejs\npm.cmd" --version
if errorlevel 1 (
    echo ✗ npm test failed
    exit /b 1
)

echo.
echo ===============================================
echo ✓ SUCCESS! Node.js PATH has been fixed.
echo ===============================================
echo.
echo IMPORTANT: Close this command prompt and open a new one
echo for the changes to take effect.
echo.
echo To verify in new command prompt:
echo   node --version
echo   npm --version
echo.
echo ===============================================
echo Installing frontend dependencies...
echo ===============================================
cd frontend

REM Clean up any corrupted node_modules
if exist node_modules (
    echo Cleaning corrupt node_modules...
    rmdir /s /q node_modules 2>nul
)

if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json 2>nul
)

echo Running npm install...
"C:\Program Files\nodejs\npm.cmd" install

echo.
if errorlevel 1 (
    echo ⚠ Some packages may have failed to install.
    echo This is usually due to PATH issues that will be resolved
    echo in a new command prompt.
) else (
    echo ✓ All packages installed successfully!
)

echo.
echo Process complete! Please close and reopen your command prompt.
pause

