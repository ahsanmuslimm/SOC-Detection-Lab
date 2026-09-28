@echo off
REM ============================================================
REM SOC Detection Lab - Required Tools Installation Script
REM Windows Batch Script for D: Drive Installation
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║  SOC Detection Lab - Required Tools Installation         ║
echo ║  Windows Environment Setup                                ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Set installation directory
set INSTALL_DIR=D:\SOC_Detection_Lab_Tools
set NODE_DIR=!INSTALL_DIR!\nodejs
set GIT_DIR=!INSTALL_DIR!\git
set POSTGRES_DIR=!INSTALL_DIR!\postgresql
set DOCKER_DIR=!INSTALL_DIR!\docker
set TERRAFORM_DIR=!INSTALL_DIR!\terraform
set KUBECTL_DIR=!INSTALL_DIR!\kubectl

echo Installation Directory: !INSTALL_DIR!
echo.

REM Create installation directory structure
echo [1/10] Creating directory structure...
if not exist "!INSTALL_DIR!" (
    mkdir "!INSTALL_DIR!"
    echo   ✓ Created !INSTALL_DIR!
) else (
    echo   ✓ Directory already exists
)

if not exist "!NODE_DIR!" mkdir "!NODE_DIR!" && echo   ✓ Created Node.js directory
if not exist "!GIT_DIR!" mkdir "!GIT_DIR!" && echo   ✓ Created Git directory
if not exist "!POSTGRES_DIR!" mkdir "!POSTGRES_DIR!" && echo   ✓ Created PostgreSQL directory
if not exist "!DOCKER_DIR!" mkdir "!DOCKER_DIR!" && echo   ✓ Created Docker directory
if not exist "!TERRAFORM_DIR!" mkdir "!TERRAFORM_DIR!" && echo   ✓ Created Terraform directory
if not exist "!KUBECTL_DIR!" mkdir "!KUBECTL_DIR!" && echo   ✓ Created kubectl directory

echo.
echo [2/10] Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ Node.js not found
    echo   → Download from: https://nodejs.org/en/download/
    echo   → Required: Node.js 18.0.0 or higher
    echo   → Choose Windows Installer (.msi)
    echo.
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo   ✓ Node.js found: !NODE_VER!
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
    echo   ✓ npm found: v!NPM_VER!
)

echo.
echo [3/10] Checking for Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ Git not found
    echo   → Download from: https://git-scm.com/download/win
    echo   → Choose "64-bit Git for Windows Setup"
    echo.
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VER=%%i
    echo   ✓ Git found: !GIT_VER!
)

echo.
echo [4/10] Checking for PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ PostgreSQL not found
    echo   → Download from: https://www.postgresql.org/download/windows/
    echo   → Choose version 15 or higher
    echo.
) else (
    for /f "tokens=*" %%i in ('psql --version') do set PG_VER=%%i
    echo   ✓ PostgreSQL found: !PG_VER!
)

echo.
echo [5/10] Checking for Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ℹ Docker not found (optional for Phase 1)
    echo   → Download from: https://www.docker.com/products/docker-desktop
    echo.
) else (
    for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VER=%%i
    echo   ✓ Docker found: !DOCKER_VER!
)

echo.
echo [6/10] Installing TypeScript (npm global)...
npm list -g typescript >nul 2>&1
if %errorlevel% neq 0 (
    echo   Installing TypeScript globally...
    call npm install -g typescript
    echo   ✓ TypeScript installed
) else (
    echo   ✓ TypeScript already installed
)

echo.
echo [7/10] Installing ESLint and Prettier...
npm list -g eslint >nul 2>&1
if %errorlevel% neq 0 (
    echo   Installing ESLint globally...
    call npm install -g eslint
    echo   ✓ ESLint installed
) else (
    echo   ✓ ESLint already installed
)

npm list -g prettier >nul 2>&1
if %errorlevel% neq 0 (
    echo   Installing Prettier globally...
    call npm install -g prettier
    echo   ✓ Prettier installed
) else (
    echo   ✓ Prettier already installed
)

echo.
echo ============================================================
echo INSTALLATION COMPLETE
echo ============================================================
echo.
echo Next steps:
echo.
echo 1. Verify installations:
echo    node --version
echo    npm --version
echo    git --version
echo.
echo 2. For Phase 1 Week 2, ensure PostgreSQL is installed:
echo    psql --version
echo.
echo 3. Navigate to project:
echo    cd "d:\WORKING\PORTFOLIO\FEATURED PROJECTS\SOC-Detection-Lab"
echo.
echo 4. Install project dependencies:
echo    npm install
echo.
echo 5. Verify setup:
echo    npm run build
echo    npm run test:unit
echo.
echo 6. Follow REQUIRED_TOOLS_QUICK_REFERENCE.md for next steps
echo.
echo ============================================================
echo.

pause
