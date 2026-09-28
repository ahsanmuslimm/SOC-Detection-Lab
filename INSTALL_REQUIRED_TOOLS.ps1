# ============================================================
# SOC Detection Lab - Required Tools Installation Script
# Windows PowerShell Script for D: Drive Installation
# ============================================================

Write-Host "`n" -ForegroundColor Green
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║  SOC Detection Lab - Required Tools Installation         ║" -ForegroundColor Green
Write-Host "║  Windows Environment Setup (PowerShell)                  ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

# Set installation directory
$INSTALL_DIR = "D:\SOC_Detection_Lab_Tools"
$NODE_DIR = "$INSTALL_DIR\nodejs"
$GIT_DIR = "$INSTALL_DIR\git"
$POSTGRES_DIR = "$INSTALL_DIR\postgresql"
$DOCKER_DIR = "$INSTALL_DIR\docker"
$TERRAFORM_DIR = "$INSTALL_DIR\terraform"
$KUBECTL_DIR = "$INSTALL_DIR\kubectl"

Write-Host "Installation Directory: $INSTALL_DIR`n" -ForegroundColor Yellow

# Create installation directory structure
Write-Host "[1/10] Creating directory structure..." -ForegroundColor Cyan

if (!(Test-Path $INSTALL_DIR)) {
    New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null
    Write-Host "   ✓ Created $INSTALL_DIR" -ForegroundColor Green
} else {
    Write-Host "   ✓ Directory already exists" -ForegroundColor Green
}

@($NODE_DIR, $GIT_DIR, $POSTGRES_DIR, $DOCKER_DIR, $TERRAFORM_DIR, $KUBECTL_DIR) | ForEach-Object {
    if (!(Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
        Write-Host "   ✓ Created $_" -ForegroundColor Green
    }
}

# Check Node.js
Write-Host "`n[2/10] Checking for Node.js..." -ForegroundColor Cyan
try {
    $nodeVer = node --version
    $npmVer = npm --version
    Write-Host "   ✓ Node.js found: $nodeVer" -ForegroundColor Green
    Write-Host "   ✓ npm found: $npmVer" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Node.js not found" -ForegroundColor Red
    Write-Host "   → Download from: https://nodejs.org/en/download/" -ForegroundColor Yellow
    Write-Host "   → Required: Node.js 18.0.0 or higher" -ForegroundColor Yellow
}

# Check Git
Write-Host "`n[3/10] Checking for Git..." -ForegroundColor Cyan
try {
    $gitVer = git --version
    Write-Host "   ✓ Git found: $gitVer" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Git not found" -ForegroundColor Red
    Write-Host "   → Download from: https://git-scm.com/download/win" -ForegroundColor Yellow
}

# Check PostgreSQL
Write-Host "`n[4/10] Checking for PostgreSQL..." -ForegroundColor Cyan
try {
    $pgVer = psql --version
    Write-Host "   ✓ PostgreSQL found: $pgVer" -ForegroundColor Green
} catch {
    Write-Host "   ✗ PostgreSQL not found" -ForegroundColor Red
    Write-Host "   → Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
}

# Check Docker
Write-Host "`n[5/10] Checking for Docker..." -ForegroundColor Cyan
try {
    $dockerVer = docker --version
    Write-Host "   ✓ Docker found: $dockerVer" -ForegroundColor Green
} catch {
    Write-Host "   ℹ Docker not found (optional for Phase 1)" -ForegroundColor Yellow
    Write-Host "   → Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
}

# Install TypeScript globally
Write-Host "`n[6/10] Installing TypeScript (npm global)..." -ForegroundColor Cyan
$typeScriptCheck = npm list -g typescript 2>&1 | Select-String "typescript"
if (!$typeScriptCheck) {
    Write-Host "   Installing TypeScript..." -ForegroundColor Yellow
    npm install -g typescript
    Write-Host "   ✓ TypeScript installed" -ForegroundColor Green
} else {
    Write-Host "   ✓ TypeScript already installed" -ForegroundColor Green
}

# Install ESLint
Write-Host "`n[7/10] Installing ESLint..." -ForegroundColor Cyan
$eslintCheck = npm list -g eslint 2>&1 | Select-String "eslint"
if (!$eslintCheck) {
    Write-Host "   Installing ESLint..." -ForegroundColor Yellow
    npm install -g eslint
    Write-Host "   ✓ ESLint installed" -ForegroundColor Green
} else {
    Write-Host "   ✓ ESLint already installed" -ForegroundColor Green
}

# Install Prettier
Write-Host "`n[8/10] Installing Prettier..." -ForegroundColor Cyan
$prettierCheck = npm list -g prettier 2>&1 | Select-String "prettier"
if (!$prettierCheck) {
    Write-Host "   Installing Prettier..." -ForegroundColor Yellow
    npm install -g prettier
    Write-Host "   ✓ Prettier installed" -ForegroundColor Green
} else {
    Write-Host "   ✓ Prettier already installed" -ForegroundColor Green
}

# Create .env template
Write-Host "`n[9/10] Creating environment template..." -ForegroundColor Cyan
$envTemplate = @"
# SOC Detection Lab Environment Variables

# Application
NODE_ENV=development
APP_PORT=3000
APP_HOST=localhost
LOG_LEVEL=debug

# Database - PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=soc_lab
DB_USER=soc_admin
DB_PASSWORD=changeme
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-jwt-secret-key-here-min-32-chars
JWT_EXPIRATION=24h
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRATION=7d

# Encryption
ENCRYPTION_KEY=your-encryption-key-here-32-chars
ENCRYPTION_ALGORITHM=aes-256-gcm

# Frontend
VITE_API_URL=http://localhost:3000/api

# Monitoring
SENTRY_DSN=
PROMETHEUS_ENABLED=true

# AWS (if using)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
"@

$envPath = "$INSTALL_DIR\.env.template"
$envTemplate | Out-File -FilePath $envPath -Encoding UTF8
Write-Host "   ✓ Created .env.template" -ForegroundColor Green

# Create setup guides
Write-Host "`n[10/10] Creating setup guides..." -ForegroundColor Cyan

$postgresSetup = @"
============================================================
PostgreSQL Installation Guide for Windows
============================================================

1. Download PostgreSQL 15 or higher from:
   https://www.postgresql.org/download/windows/

2. Run the installer with these settings:
   - Installation directory: D:\PostgreSQL
   - Password for postgres user: (enter secure password)
   - Port: 5432
   - Locale: Default

3. After installation, verify:
   psql --version

4. Create SOC Detection Lab database:
   psql -U postgres
   CREATE DATABASE soc_lab;
   \c soc_lab
   CREATE USER soc_admin WITH PASSWORD 'changeme';
   GRANT ALL PRIVILEGES ON DATABASE soc_lab TO soc_admin;

5. Update .env with your database password

6. Useful PostgreSQL commands:
   psql -U postgres
   psql -d soc_lab -U soc_admin
   \dt                (list tables)
   \du                (list users)
   DROP DATABASE soc_lab;  (if needed)
"@

$postgresSetup | Out-File -FilePath "$INSTALL_DIR\POSTGRESQL_SETUP.txt" -Encoding UTF8
Write-Host "   ✓ Created POSTGRESQL_SETUP.txt" -ForegroundColor Green

$dockerSetup = @"
============================================================
Docker Installation Guide for Windows
============================================================

1. Download Docker Desktop from:
   https://www.docker.com/products/docker-desktop

2. Install Docker Desktop with defaults
   - WSL 2 backend recommended
   - Enable Hyper-V (if available)

3. After installation, verify:
   docker --version
   docker run hello-world

4. Useful Docker commands:
   # Start PostgreSQL in container
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
   
   docker ps               (list running containers)
   docker logs container-id  (view logs)
   docker stop container-id  (stop container)

5. For development with Docker Compose:
   cd to project directory
   docker-compose up -d
   docker-compose down
"@

$dockerSetup | Out-File -FilePath "$INSTALL_DIR\DOCKER_SETUP.txt" -Encoding UTF8
Write-Host "   ✓ Created DOCKER_SETUP.txt" -ForegroundColor Green

$terraformSetup = @"
============================================================
Terraform Installation Guide for Windows
============================================================

1. Download Terraform 1.4 or higher from:
   https://www.terraform.io/downloads

2. Extract to: D:\terraform

3. Add D:\terraform to PATH environment variable:
   - Right-click Start menu → System
   - Click Advanced system settings
   - Click Environment Variables
   - Under "User variables", click New
   - Variable name: PATH
   - Variable value: D:\terraform
   - Click OK

4. Verify installation:
   terraform --version

5. Common Terraform commands:
   terraform init       (initialize)
   terraform plan       (preview changes)
   terraform apply      (apply changes)
   terraform destroy    (destroy resources)
"@

$terraformSetup | Out-File -FilePath "$INSTALL_DIR\TERRAFORM_SETUP.txt" -Encoding UTF8
Write-Host "   ✓ Created TERRAFORM_SETUP.txt" -ForegroundColor Green

$kubernetesSetup = @"
============================================================
Kubernetes kubectl Installation Guide for Windows
============================================================

1. kubectl is included with Docker Desktop
   After Docker Desktop installation:
   kubectl version --client

2. Alternative: Download directly from:
   https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/

3. Add kubectl to PATH if not included with Docker

4. Verify installation:
   kubectl version --client
   kubectl cluster-info

5. Common kubectl commands:
   kubectl get pods              (list pods)
   kubectl get services          (list services)
   kubectl apply -f file.yaml    (apply config)
   kubectl delete -f file.yaml   (delete config)
   kubectl logs pod-name         (view logs)
   kubectl port-forward pod-name 3000:3000  (port forward)
"@

$kubernetesSetup | Out-File -FilePath "$INSTALL_DIR\KUBERNETES_SETUP.txt" -Encoding UTF8
Write-Host "   ✓ Created KUBERNETES_SETUP.txt" -ForegroundColor Green

# Create installation checklist
$checklist = @"
============================================================
SOC Detection Lab - Installation Checklist
============================================================

REQUIRED TOOLS (MUST INSTALL):

[ ] Node.js 18.0.0 or higher
    Download: https://nodejs.org/en/download/
    Verify: node --version & npm --version

[ ] Git (latest)
    Download: https://git-scm.com/download/win
    Verify: git --version

[ ] PostgreSQL 15 or higher
    Download: https://www.postgresql.org/download/windows/
    Setup Guide: POSTGRESQL_SETUP.txt
    Verify: psql --version

[ ] VS Code (optional but recommended)
    Download: https://code.visualstudio.com/download
    Extensions:
      - TypeScript Vue Plugin
      - ESLint
      - Prettier
      - REST Client

OPTIONAL TOOLS (FOR LATER PHASES):

[ ] Docker Desktop
    Download: https://www.docker.com/products/docker-desktop
    Setup Guide: DOCKER_SETUP.txt
    Needed for: Phase 1 Week 4+

[ ] Terraform 1.4 or higher
    Download: https://www.terraform.io/downloads
    Setup Guide: TERRAFORM_SETUP.txt
    Needed for: Phase 3 Week 10+

ENVIRONMENT SETUP:

[ ] Copy .env.template to project root as .env
[ ] Update .env with your local values
[ ] Set PATH environment variables if needed

VERIFICATION COMMANDS:

Run these in PowerShell or Command Prompt:
  node --version        (should show v18.x.x or higher)
  npm --version         (should show v9.x.x or higher)
  git --version         (should show installed version)
  tsc --version         (should show TypeScript version)
  psql --version        (should show PostgreSQL version)

NEXT STEPS:

1. Complete all required tools installation
2. Navigate to project:
   cd "d:\WORKING\PORTFOLIO\FEATURED PROJECTS\SOC-Detection-Lab"
3. Install dependencies:
   npm install
4. Verify setup:
   npm run build
5. Run tests:
   npm run test:unit
6. Begin Phase 1 Week 2 implementation
"@

$checklist | Out-File -FilePath "$INSTALL_DIR\INSTALLATION_CHECKLIST.txt" -Encoding UTF8
Write-Host "   ✓ Created INSTALLATION_CHECKLIST.txt" -ForegroundColor Green

# Print summary
Write-Host "`n" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "INSTALLATION COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Installation directory: $INSTALL_DIR" -ForegroundColor Yellow
Write-Host ""
Write-Host "Created guides and templates:" -ForegroundColor Yellow
Write-Host "  • POSTGRESQL_SETUP.txt" -ForegroundColor Gray
Write-Host "  • DOCKER_SETUP.txt" -ForegroundColor Gray
Write-Host "  • TERRAFORM_SETUP.txt" -ForegroundColor Gray
Write-Host "  • KUBERNETES_SETUP.txt" -ForegroundColor Gray
Write-Host "  • INSTALLATION_CHECKLIST.txt" -ForegroundColor Gray
Write-Host "  • .env.template" -ForegroundColor Gray
Write-Host ""
Write-Host "Verification:" -ForegroundColor Yellow

# Final verification
try { $nodeVer = node --version; Write-Host "  ✓ Node.js $nodeVer" -ForegroundColor Green } catch { Write-Host "  ✗ Node.js" -ForegroundColor Red }
try { $npmVer = npm --version; Write-Host "  ✓ npm v$npmVer" -ForegroundColor Green } catch { Write-Host "  ✗ npm" -ForegroundColor Red }
try { $gitVer = git --version; Write-Host "  ✓ $gitVer" -ForegroundColor Green } catch { Write-Host "  ✗ Git" -ForegroundColor Red }
try { $tscVer = tsc --version; Write-Host "  ✓ TypeScript $tscVer" -ForegroundColor Green } catch { Write-Host "  ✗ TypeScript" -ForegroundColor Red }
try { $pgVer = psql --version; Write-Host "  ✓ $pgVer" -ForegroundColor Green } catch { Write-Host "  ✗ PostgreSQL" -ForegroundColor Red }

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Follow any "NOT INSTALLED" tool guides from $INSTALL_DIR" -ForegroundColor Gray
Write-Host "  2. Run: cd 'd:\WORKING\PORTFOLIO\FEATURED PROJECTS\SOC-Detection-Lab'" -ForegroundColor Gray
Write-Host "  3. Run: npm install" -ForegroundColor Gray
Write-Host "  4. Run: npm run build" -ForegroundColor Gray
Write-Host "  5. Begin Phase 1 Week 2 development" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
