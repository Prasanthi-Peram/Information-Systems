@echo off
REM Quick Start Script for Frontend Backend Setup
REM Usage: quick-start.bat

echo.
echo 🚀 Frontend Backend Quick Start
echo ===============================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%
echo.

REM Check if .env file exists
if not exist ".env" (
    echo 📝 Creating .env file from .env.example...
    copy .env.example .env
    echo ✅ .env file created. Please edit it with your configuration.
    echo.
    echo Opening .env in notepad. Please configure the settings.
    start notepad .env
) else (
    echo ✅ .env file already exists
    echo.
)

REM Install dependencies
echo 📦 Installing dependencies...
echo.
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo.
echo ✅ Installation complete!
echo.

REM Display next steps
echo 📋 Next Steps:
echo =============
echo.
echo 1. 📝 Configure .env file:
echo    - Edit .env with your database credentials
echo    - Set API_URL to your backend server
echo.
echo 2. 🗄️  Ensure database is running:
echo    docker-compose up -d db
echo.
echo 3. 🚀 Start development server:
echo    npm run dev
echo.
echo 4. 🧪 Run tests in another terminal:
echo    npm run test:all
echo.
echo 5. 📚 Read documentation:
echo    - API.md - API endpoint reference
echo    - tests/README.md - Testing guide
echo    - BACKEND_SETUP.md - Complete setup information
echo.
echo 🎉 Happy coding!
echo.

pause
