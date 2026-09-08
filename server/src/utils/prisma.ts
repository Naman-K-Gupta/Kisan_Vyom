import { PrismaClient as PostgresPrismaClient } from '@prisma/client';
import { logger } from './logger';
import fs from 'fs';
import path from 'path';

let internalPrisma: any;
let isUsingSqlite = false;

// Determine initial database mode
const prismaDevDb = path.resolve(__dirname, '../../prisma/dev.db');
const rootDevDb = path.resolve(__dirname, '../../dev.db');
const sqlitePath = fs.existsSync(prismaDevDb) ? prismaDevDb : rootDevDb;
const forceSqlite =
  process.env.USE_SQLITE === 'true' ||
  Boolean(process.env.SQLITE_DATABASE_URL && !process.env.DATABASE_URL);

if (forceSqlite) {
  try {
    const { PrismaClient: SqlitePrismaClient } = require('../../prisma/generated/sqlite');
    internalPrisma = new SqlitePrismaClient({
      datasources: { db: { url: `file:${sqlitePath}` } },
      log: ['error'],
    });
    isUsingSqlite = true;
    logger.info('Initialized in offline SQLite mode');
  } catch (err) {
    internalPrisma = new PostgresPrismaClient();
  }
} else {
  internalPrisma = new PostgresPrismaClient({
    log: ['error'],
  });
}

// Exported prisma proxy with full PrismaClient typing
export const prisma: PostgresPrismaClient = new Proxy(
  {},
  {
    get(_target, prop) {
      return internalPrisma[prop];
    },
  }
) as unknown as PostgresPrismaClient;

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await (internalPrisma as any).$queryRaw`SELECT 1`;
    logger.success(
      `Connected to Database successfully (${isUsingSqlite ? 'SQLite Offline Mode' : 'PostgreSQL'})`
    );
    return true;
  } catch (error: any) {
    logger.warn('Primary PostgreSQL connection attempt failed:', error.message || error);

    // Automatic seamless fallback to local SQLite if present
    if (!isUsingSqlite && fs.existsSync(sqlitePath)) {
      try {
        logger.info('Falling back to local SQLite database (dev.db)...');
        const { PrismaClient: SqlitePrismaClient } = require('../../prisma/generated/sqlite');
        internalPrisma = new SqlitePrismaClient({
          datasources: { db: { url: `file:${sqlitePath}` } },
          log: ['error'],
        });
        await (internalPrisma as any).$queryRaw`SELECT 1`;
        isUsingSqlite = true;
        logger.success('✅ Connected to local development database successfully via SQLite fallback');
        return true;
      } catch (fallbackErr: any) {
        logger.error('SQLite fallback connection also failed:', fallbackErr.message);
      }
    }

    logger.warn(
      'Database is currently unreachable. Configure DATABASE_URL in .env to connect PostgreSQL or Neon.'
    );
    return false;
  }
}

// Graceful disconnect on shutdown
process.on('beforeExit', async () => {
  if (internalPrisma && typeof internalPrisma.$disconnect === 'function') {
    await internalPrisma.$disconnect();
  }
});
