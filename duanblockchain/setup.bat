@echo off
echo ========================================
echo    NFT Marketplace Setup Script
echo ========================================

echo.
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)
echo Node.js found!

echo.
echo [2/5] Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [3/5] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo [4/5] Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo .env file created from template
    echo.
    echo IMPORTANT: Please update .env with your actual keys:
    echo - PRIVATE_KEY: Your wallet private key
    echo - CRONOS_API_KEY: Your Cronos API key
    echo - PINATA_API_KEY: Your Pinata API key
    echo - PINATA_SECRET_API_KEY: Your Pinata secret key
    echo - PINATA_JWT: Your Pinata JWT token
    echo.
) else (
    echo .env file already exists
)

echo.
echo [5/5] Setup completed!
echo.
echo Next steps:
echo 1. Update .env file with your credentials
echo 2. Run: npx hardhat compile
echo 3. Run: npx hardhat run scripts/deploy.js --network cronos_testnet
echo 4. Start frontend: cd frontend && npm start
echo.
pause