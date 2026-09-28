# D: Drive Setup Instructions - SOC Detection Lab

## Manual Installation Guide for Windows

---

## Quick Start (5 Minutes)

### Option 1: Automated Setup (Recommended)

**Using Batch Script**:
```batch
# Save INSTALL_REQUIRED_TOOLS.bat to D:\
# Double-click to run
# Follow on-screen instructions
```

**Using PowerShell**:
```powershell
# Save INSTALL_REQUIRED_TOOLS.ps1 to D:\
# Right-click → Run with PowerShell
# Or run in PowerShell:
powershell -ExecutionPolicy Bypass -File "D:\INSTALL_REQUIRED_TOOLS.ps1"
```

### Option 2: Manual Installation

Follow instructions below for each tool.

---

## Step-by-Step Manual Installation

### Step 1: Node.js (Required)

**Download**:
- Go to: https://nodejs.org/en/download/
- Choose: **Windows Installer (.msi)** - 18.x LTS or higher
- Save to: `D:\Downloads\`

**Install**:
1. Double-click the .msi file
2. Choose installation directory: `D:\nodejs` (or accept default)
3. Complete installation
4. **Do NOT uncheck** "Add to PATH"

**Verify**:
```bash
node --version      # Should show v18.x.x or higher
npm --version       # Should show v9.x.x or higher
```

---

### Step 2: Git (Required)

**Download**:
- Go to: https://git-scm.com/download/win
- Choose: **64-bit Git for Windows Setup**
- Save to: `D:\Downloads\`

**Install**:
1. Double-click the installer
2. Choose installation directory: `D:\git` (or accept default)
3. Choose default options
4. Complete installation

**Verify**:
```bash
git --version       # Should show: git version x.x.x.windows.x
```

---

### Step 3: PostgreSQL (Required for Week 2)

**Download**:
- Go to: https://www.postgresql.org/download/windows/
- Choose: **PostgreSQL 15** or higher (latest stable)
- Save to: `D:\Downloads\`

**Install**:
1. Double-click the installer
2. Installation directory: `D:\PostgreSQL` (recommended)
3. Password for postgres user: **SAVE THIS** - you'll need it
4. Port: **5432** (default)
5. Locale: Default
6. Complete installation

**Post-Installation Setup**:
```bash
# Open Command Prompt or PowerShell

# Connect to PostgreSQL
psql -U postgres

# In psql prompt, create database and user:
CREATE DATABASE soc_lab;
\c soc_lab
CREATE USER soc_admin WITH PASSWORD 'changeme';
GRANT ALL PRIVILEGES ON DATABASE soc_lab TO soc_admin;
\q
```

**Verify**:
```bash
psql --version      # Should show: psql (PostgreSQL) x.x
psql -U postgres    # Should connect (type \q to exit)
```

---

### Step 4: Visual Studio Code (Recommended)

**Download**:
- Go to: https://code.visualstudio.com/download
- Choose: **Windows** (.exe)
- Save to: `D:\Downloads\`

**Install**:
1. Double-click the installer
2. Complete installation
3. Open VS Code

**Install Extensions**:
1. Click Extensions icon (left sidebar)
2. Search and install:
   - TypeScript Vue Plugin
   - ESLint
   - Prettier
   - REST Client

---

### Step 5: Docker (Optional - Needed for Week 4+)

**Download**:
- Go to: https://www.docker.com/products/docker-desktop
- Choose: **Docker Desktop for Windows**
- Save to: `D:\Downloads\`

**Install**:
1. Double-click installer
2. Choose "WSL 2" backend (recommended)
3. Complete installation
4. Restart computer when prompted

**Verify**:
```bash
docker --version    # Should show: Docker version xx.xx.x
docker run hello-world  # Should print hello message
```

---

### Step 6: Terraform (Optional - Needed for Week 10+)

**Download**:
- Go to: https://www.terraform.io/downloads
- Choose: **Windows (amd64)** - zip file
- Save to: `D:\Downloads\`

**Install**:
1. Extract zip to: `D:\terraform`
2. Add to PATH environment variable

**Add to PATH**:
1. Right-click Start menu → System
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "User variables", click "New"
5. Variable name: `PATH`
6. Variable value: `D:\terraform`
7. Click OK

**Verify**:
```bash
terraform --version    # Should show: Terraform v1.4.x or higher
```

---

## NPM Global Packages Setup

After Node.js and npm are installed, run:

```bash
# Install TypeScript globally
npm install -g typescript

# Verify
tsc --version

# Install ESLint globally
npm install -g eslint

# Install Prettier globally
npm install -g prettier

# Install development tools
npm install -g @typescript-eslint/eslint-plugin
```

---

## Project Setup (After All Tools Installed)

### 1. Navigate to Project

```bash
cd "d:\WORKING\PORTFOLIO\FEATURED PROJECTS\SOC-Detection-Lab"
```

### 2. Install Project Dependencies

```bash
npm install
```

### 3. Verify Setup

```bash
npm run build           # Should compile without errors
npm run test:unit       # Should run unit tests
```

### 4. Create .env File

```bash
# Copy template
copy .env.example .env

# Edit .env with your values:
# - DB_PASSWORD: PostgreSQL password you set
# - Other values: Use defaults for local development
```

---

## Directory Structure Created

```
D:\
├── SOC_Detection_Lab_Tools\          (if using scripts)
│   ├── nodejs\
│   ├── git\
│   ├── postgresql\
│   ├── docker\
│   ├── terraform\
│   ├── kubectl\
│   ├── .env.template
│   ├── POSTGRESQL_SETUP.txt
│   ├── DOCKER_SETUP.txt
│   ├── TERRAFORM_SETUP.txt
│   ├── KUBERNETES_SETUP.txt
│   └── INSTALLATION_CHECKLIST.txt
│
└── WORKING\
    └── PORTFOLIO\
        └── FEATURED PROJECTS\
            └── SOC-Detection-Lab\
                ├── node_modules\
                ├── src\
                ├── package.json
                ├── .env
                └── ... (project files)
```

---

## Verification Checklist

Run these commands to verify everything is installed:

```bash
# Check all tools
node --version      # v18.x.x or higher
npm --version       # v9.x.x or higher
git --version       # git version x.x.x
tsc --version       # Version x.x.x
psql --version      # psql (PostgreSQL) x.x

# Optional tools (can skip if not installing)
docker --version    # Docker version xx.xx.x
terraform --version # Terraform v1.4.x

# Check project
cd "d:\WORKING\PORTFOLIO\FEATURED PROJECTS\SOC-Detection-Lab"
npm --version       # Should work
npm run build       # Should compile
```

---

## Troubleshooting

### Node.js Won't Install
- **Issue**: Windows SmartScreen warning
- **Solution**: Click "More info" → "Run anyway"

### psql Command Not Found
- **Issue**: PostgreSQL PATH not set
- **Solution**: 
  1. Restart Command Prompt/PowerShell
  2. If still not found, manually add to PATH:
     - Find PostgreSQL bin folder (usually `C:\Program Files\PostgreSQL\15\bin`)
     - Add to System PATH

### Docker Won't Start
- **Issue**: WSL 2 backend error
- **Solution**: Install Windows Subsystem for Linux 2
  ```bash
  wsl --install
  wsl --set-default-version 2
  ```

### npm install Fails
- **Issue**: Dependency conflicts
- **Solution**: 
  ```bash
  npm cache clean --force
  rm package-lock.json
  npm install
  ```

### Port Already in Use
- **Issue**: Port 3000 or 5432 already in use
- **Solution**: Change in .env or stop other services

---

## Environment Variables Setup

Create `.env` file in project root:

```bash
# Copy from template
copy .env.example .env

# Edit with your values:
```

### Required for Phase 1:
```
NODE_ENV=development
APP_PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=soc_lab
DB_USER=soc_admin
DB_PASSWORD=<your-postgres-password>
```

### Optional (for later phases):
```
REDIS_HOST=localhost
AWS_REGION=us-east-1
VITE_API_URL=http://localhost:3000/api
```

---

## PostgreSQL Quick Commands

```bash
# Connect to PostgreSQL
psql -U postgres

# List databases
\l

# Connect to database
\c soc_lab

# List tables
\dt

# List users
\du

# Create new user
CREATE USER newuser WITH PASSWORD 'password';

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE soc_lab TO newuser;

# Exit
\q
```

---

## Common Commands Cheat Sheet

### Project
```bash
cd "d:\WORKING\PORTFOLIO\FEATURED PROJECTS\SOC-Detection-Lab"
npm install              # Install dependencies
npm run build            # Build project
npm run dev              # Start development server
npm run test:unit        # Run unit tests
npm run lint             # Check code style
npm run format           # Format code
```

### Database
```bash
npm run db:migrate       # Run migrations
npm run db:seed          # Load seed data
psql -U soc_admin -d soc_lab  # Connect to database
```

### Docker
```bash
docker ps                # List running containers
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
docker-compose up -d     # Start services
docker-compose down      # Stop services
```

---

## Next Steps

After successful installation:

1. ✅ All tools installed and verified
2. 📦 Project dependencies installed (`npm install`)
3. 🏗️ Project builds successfully (`npm run build`)
4. ✅ Tests pass (`npm run test:unit`)
5. 📖 Open `REQUIRED_TOOLS_QUICK_REFERENCE.md`
6. 🎯 Begin Phase 1, Week 2: Database Layer

---

## Support & Resources

### Official Documentation
- Node.js: https://nodejs.org/docs/
- npm: https://docs.npmjs.com/
- Git: https://git-scm.com/doc
- PostgreSQL: https://www.postgresql.org/docs/
- Docker: https://docs.docker.com/
- Terraform: https://www.terraform.io/docs

### Project Documentation
- `START_HERE.md` - Quick start guide
- `REQUIRED_TOOLS_QUICK_REFERENCE.md` - Tools reference
- `PRODUCTION_IMPLEMENTATION_SPEC.md` - Implementation tasks
- `BUILD_GUIDELINES.md` - Code quality standards

---

## Installation Complete!

You're ready to start Phase 1, Week 2 development.

**Next**: Open `REQUIRED_TOOLS_QUICK_REFERENCE.md` and follow Phase 1 Week 2 setup.

---

**Last Updated**: Production Roadmap Setup  
**Version**: 1.0  
**Status**: Ready for Use
