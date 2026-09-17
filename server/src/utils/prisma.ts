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
    if (isUsingSqlite) {
      await ensureSqliteTables();
    } else {
      await ensurePostgresTables();
    }
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
        await ensureSqliteTables();
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

async function ensureSqliteTables() {
  if (!internalPrisma || !isUsingSqlite) return;
  try {
    await (internalPrisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Payment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "paymentNumber" TEXT NOT NULL UNIQUE,
        "farmerId" TEXT NOT NULL,
        "centreId" TEXT NOT NULL,
        "cropId" TEXT NOT NULL,
        "queueTokenId" TEXT,
        "procurementRequestId" TEXT,
        "quantity" REAL NOT NULL,
        "unit" TEXT NOT NULL DEFAULT 'Quintal',
        "ratePerUnit" REAL NOT NULL,
        "grossAmount" REAL NOT NULL,
        "deductions" REAL NOT NULL DEFAULT 0,
        "netAmount" REAL NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PROCESSING',
        "paymentMethod" TEXT NOT NULL DEFAULT 'DBT_PFMS',
        "utrNumber" TEXT,
        "bankName" TEXT DEFAULT 'State Bank of India',
        "accountNumberMasked" TEXT,
        "ifscCode" TEXT DEFAULT 'SBIN0001234',
        "qualityGrade" TEXT DEFAULT 'Grade A (FAQ)',
        "paidAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await (internalPrisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FarmerBankRecord" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "accountHolderName" TEXT NOT NULL,
        "bankName" TEXT NOT NULL,
        "accountNumber" TEXT NOT NULL,
        "accountNumberMasked" TEXT NOT NULL,
        "ifscCode" TEXT NOT NULL,
        "branchName" TEXT NOT NULL,
        "aadhaarLinked" BOOLEAN NOT NULL DEFAULT 1,
        "pfmsStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
        "upiId" TEXT,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await (internalPrisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FarmerTelegramLink" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "mobile" TEXT NOT NULL UNIQUE,
        "userId" TEXT,
        "chatId" TEXT NOT NULL,
        "username" TEXT,
        "firstName" TEXT,
        "isActive" INTEGER NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await (internalPrisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GovernmentScheme" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'SUBSIDY',
        "ministry" TEXT NOT NULL DEFAULT 'Ministry of Agriculture & Farmers Welfare',
        "benefitAmount" TEXT NOT NULL,
        "summary" TEXT NOT NULL,
        "details" TEXT,
        "eligibilityCriteria" TEXT NOT NULL,
        "maxLandAcreage" REAL,
        "applicableStates" TEXT NOT NULL DEFAULT 'ALL',
        "applicationUrl" TEXT NOT NULL,
        "officialCircularUrl" TEXT,
        "deadlineDate" DATETIME,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "isFeatured" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err: any) {
    logger.warn('Could not auto-create SQLite tables:', err.message);
  }
}

async function ensurePostgresTables() {
  if (!internalPrisma || isUsingSqlite) return;
  try {
    await (internalPrisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FarmerTelegramLink" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "mobile" TEXT NOT NULL UNIQUE,
        "userId" TEXT,
        "chatId" TEXT NOT NULL,
        "username" TEXT,
        "firstName" TEXT,
        "isActive" INTEGER NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await (internalPrisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FarmerBankRecord" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "accountHolderName" TEXT NOT NULL,
        "bankName" TEXT NOT NULL,
        "accountNumber" TEXT NOT NULL,
        "accountNumberMasked" TEXT NOT NULL,
        "ifscCode" TEXT NOT NULL,
        "branchName" TEXT NOT NULL,
        "aadhaarLinked" BOOLEAN NOT NULL DEFAULT true,
        "pfmsStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
        "upiId" TEXT,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err: any) {
    logger.warn('Could not auto-create PostgreSQL tables:', err.message);
  }
}

// Graceful disconnect on shutdown
process.on('beforeExit', async () => {
  if (internalPrisma && typeof internalPrisma.$disconnect === 'function') {
    await internalPrisma.$disconnect();
  }
});
