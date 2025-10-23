@echo off
echo 🚀 HapiVet AI - Quick Start Script
echo ==================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
npm install

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
npm install
cd ..

REM Create data directory
echo 📁 Creating data directory...
if not exist "backend\data" mkdir backend\data

REM Create environment file template
echo ⚙️ Creating environment file template...
(
echo # Google Cloud Configuration
echo GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
echo GOOGLE_CLOUD_PROJECT_ID=your_project_id
echo.
echo # Twilio Configuration
echo TWILIO_ACCOUNT_SID=your_twilio_account_sid
echo TWILIO_AUTH_TOKEN=your_twilio_auth_token
echo TWILIO_PHONE_NUMBER=your_twilio_phone_number
echo.
echo # Server Configuration
echo PORT=3001
echo NODE_ENV=development
) > .env.local

echo ✅ Environment file created at .env.local
echo 📝 Please update the environment variables with your actual values

REM Create backend environment file
(
echo # Google Cloud Configuration
echo GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
echo GOOGLE_CLOUD_PROJECT_ID=your_project_id
echo.
echo # Twilio Configuration
echo TWILIO_ACCOUNT_SID=your_twilio_account_sid
echo TWILIO_AUTH_TOKEN=your_twilio_auth_token
echo TWILIO_PHONE_NUMBER=your_twilio_phone_number
echo.
echo # Server Configuration
echo PORT=3001
echo NODE_ENV=development
) > backend\.env

echo ✅ Backend environment file created at backend\.env

echo.
echo 🎉 Setup Complete!
echo ==================
echo.
echo Next steps:
echo 1. Update .env.local and backend\.env with your actual credentials
echo 2. Start the backend server: cd backend ^&^& npm run dev
echo 3. Start the frontend: npm run dev
echo 4. Install ngrok from https://ngrok.com/download
echo 5. Start ngrok: ngrok http 3001
echo 6. Update Twilio webhook URLs with your ngrok URL
echo.
echo 📖 For detailed setup instructions, see SETUP_GUIDE.md
echo.
echo 🚀 Happy coding!
pause
