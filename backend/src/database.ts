import { PrismaClient } from '@prisma/client';

// 1. Next.js Singleton Pattern
// In development, Next.js hot-reloads the server frequently. 
// This prevents Next.js from exhausting your MySQL connection limit by reusing the same client.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Optional: Log queries in development mode
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 2. Explicit Connection Test (Optional but kept for parity with your old file)
export const testConnection = async () => {
  try {
    await prisma.$connect();
    console.log('Successfully established database connection via Prisma');
  } catch (error) {
    console.error('Unable to establish database connection:', error);
  }
};

// You generally don't need to call this manually in Next.js, as Prisma connects lazily 
// on the first query, but you can invoke it in your server startup if desired.
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}