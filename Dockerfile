FROM node:22-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl
COPY package*.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

RUN PROD_DATABASE_URL="mysql://root:password@localhost:3306/build_db" npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.* ./ 
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]