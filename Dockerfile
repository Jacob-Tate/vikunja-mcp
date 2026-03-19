# syntax=docker/dockerfile:1

FROM node:22-slim AS builder
WORKDIR /app

# Install build tools needed for better-sqlite3 native addon
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ── Runtime ───────────────────────────────────────────────────────────────────

FROM node:22-slim AS runtime
WORKDIR /app

COPY package.json package-lock.json ./

# Install prod deps with build tools, then purge them to keep the image small
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && npm ci --omit=dev \
    && apt-get purge -y python3 make g++ \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data

RUN useradd --system --uid 1001 --gid root mcp \
    && chown -R mcp:root /app/data

USER mcp

VOLUME ["/app/data"]

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000 \
    AUTH_DB_PATH=/app/data/auth.db

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT||3000) + '/.well-known/oauth-authorization-server', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]
