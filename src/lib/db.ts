import { PrismaClient } from '@prisma/client'

// Set default DB_URL if not defined (for Vercel deployment)
if (!process.env.DB_URL) {
  process.env.DB_URL = 'file:/tmp/studymaster.db'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db