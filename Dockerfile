# ─── Étape 1 : installation des dépendances ──────────────────────
FROM node:22-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci

# ─── Étape 2 : build ─────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# URL factice uniquement pour que prisma generate et next build passent
# (aucune connexion réelle n'est faite au build time)
RUN PROD_DATABASE_URL="mysql://build:build@localhost:3306/build" \
    NEXTAUTH_SECRET="build-time-placeholder-secret" \
    NODE_ENV=production \
    npm run build

# ─── Étape 3 : image de production ───────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

# Uniquement ce qui est nécessaire au runtime
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
