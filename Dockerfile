# SOC Detection Lab — Production Image
# Multi-stage build: dependencies → backend (tsc) + frontend (vite) → runtime

# ---------- Stage 1: build ----------
FROM node:20-alpine AS build

WORKDIR /app

ENV HUSKY=0

# Install root dependencies (scripts off: no git repo inside the image,
# husky prepare would fail)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund || npm install --ignore-scripts --no-audit --no-fund

# Build backend (tsc → dist/)
COPY tsconfig.backend.json ./
COPY src/backend ./src/backend
RUN npx tsc --project tsconfig.backend.json

# Build frontend (vite → src/frontend/dist)
COPY src/frontend/package.json src/frontend/package-lock.json ./src/frontend/
RUN cd src/frontend && (npm ci --ignore-scripts --no-audit --no-fund || npm install --ignore-scripts --no-audit --no-fund)
COPY src/frontend ./src/frontend
RUN cd src/frontend && npm run build

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Runtime dependencies only (frontend is served as static assets by the API
# gateway or a reverse proxy; keep the node dependency tree minimal)
ENV HUSKY=0
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund || npm install --omit=dev --ignore-scripts --no-audit --no-fund

# Compiled backend
COPY --from=build /app/dist ./dist

# Frontend static assets (served by the gateway if SERVE_STATIC=true)
COPY --from=build /app/src/frontend/dist ./public

# Database migrations (applied by scripts/db-migrate on boot or manually)
COPY database ./database

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/backend/index.js"]
