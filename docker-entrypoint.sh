#!/bin/sh
set -e

echo "[entrypoint] Applying Prisma schema..."
if npx prisma migrate deploy; then
	echo "[entrypoint] Prisma migrations applied"
else
	echo "[entrypoint] No migrations found or migration deploy failed, fallback to db push"
	npx prisma db push
fi

echo "[entrypoint] Starting Next.js..."
exec npm run start
