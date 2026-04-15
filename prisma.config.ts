import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const resolveDatabaseUrl = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const preferredVar = isProduction ? "PROD_DATABASE_URL" : "DEV_DATABASE_URL";

  return process.env[preferredVar] || process.env.DATABASE_URL || "mysql://root:password@localhost:3306/db";
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
