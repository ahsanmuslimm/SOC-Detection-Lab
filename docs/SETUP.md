# Setup Guide

## Prerequisites

- Node.js 18+
- npm 9+
- Docker (optional, for services)

## Installation

```bash
# Clone and install
git clone [repository]
cd SOC-Detection-Lab
npm install

# Copy environment template
cp .env.example .env

# Start services (Docker)
docker-compose up -d

# Run migrations
npm run db:migrate

# Verify setup
npm run health
```

## Development Server

```bash
npm run dev
```

Starts both backend (port 3000) and frontend (port 3001).

## Common Issues

**Port already in use**: Change `APP_PORT` in `.env`

**npm install fails**: 
- Clear cache: `npm cache clean --force`
- Reinstall: `rm -rf node_modules && npm install`

**Database connection error**:
- Check `.env` database settings
- Verify Docker services: `docker-compose ps`

## Next Steps

1. Read [ARCHITECTURE.md](ARCHITECTURE.md)
2. Start with backend setup: `cd src/backend`
3. Review [DEVELOPMENT.md](DEVELOPMENT.md)
