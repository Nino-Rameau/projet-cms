import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const resolveDatabaseUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  const preferredVar = isProduction ? 'PROD_DATABASE_URL' : 'DEV_DATABASE_URL'

  return process.env[preferredVar] || process.env.DATABASE_URL
}

const prismaClientSingleton = () => {
  const databaseUrl = resolveDatabaseUrl()

  if (!databaseUrl) {
    throw new Error(
      'Missing database URL environment variable (expected DEV_DATABASE_URL in dev or PROD_DATABASE_URL in production)'
    )
  }

  const adapter = new PrismaMariaDb(databaseUrl)

  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis

const prisma = globalForPrisma.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaGlobal = prisma