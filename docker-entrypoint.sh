#!/bin/sh
set -e

echo "[entrypoint] Applying Prisma schema..."
npx prisma db push
echo "[entrypoint] Prisma schema applied"

echo "[entrypoint] Starting Next.js..."
exec npm run start
