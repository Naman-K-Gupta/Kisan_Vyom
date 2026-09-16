import express from 'express';
import 'express-async-errors';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';

import { ENV } from './utils/env';
import { logger } from './utils/logger';
import { checkDatabaseConnection, prisma } from './utils/prisma';
import { initializeSocketIO } from './sockets/socketHandler';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { startTelegramBotListener } from './services/telegram.service';
import { ensureComprehensiveDemoData } from './services/demoSeed.service';

const app = express();
const server = http.createServer(app);

// 1. Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});
initializeSocketIO(io);

// 2. Global Security & Parsing Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows images to be served to client
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiter for general API routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// 3. Static File Serving for Uploads
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// 4. API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', async (_req, res) => {
  const dbOk = await checkDatabaseConnection();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: dbOk ? 'connected' : 'disconnected',
    version: '1.0.0',
  });
});

// Demo data seeding endpoint for Render / remote initialization
app.get('/api/demo/seed', async (req, res) => {
  try {
    const force = req.query.force === 'true' || req.query.force === '1';
    await ensureComprehensiveDemoData(force);
    res.json({ success: true, message: 'Comprehensive demo data seeded successfully' });
  } catch (err: any) {
    logger.error('Manual demo seed failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Static Client Serving in Production
const clientDistDir = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path.startsWith('/socket.io') ||
      req.path.startsWith('/health')
    ) {
      return next();
    }
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });
}

// 6. Centralized Error Handler
app.use(errorHandler);

async function cleanupRameshData() {
  try {
    const rameshUsers = await (prisma as any).user.findMany({
      where: {
        OR: [
          { email: 'farmer.ramesh@smartfarmer.gov.in' },
          { fullName: { contains: 'Ramesh' } },
        ],
      },
      include: { farmerProfile: true },
    });

    for (const u of rameshUsers) {
      logger.info(`Cleaning up user: ${u.email} (${u.fullName})...`);
      if (u.farmerProfile?.id) {
        await (prisma as any).farmerCrop.deleteMany({
          where: { farmerProfileId: u.farmerProfile.id },
        }).catch(() => {});
        await (prisma as any).farmerProfile.delete({
          where: { id: u.farmerProfile.id },
        }).catch(() => {});
      }
      await (prisma as any).notificationPreference.deleteMany({
        where: { userId: u.id },
      }).catch(() => {});
      await (prisma as any).queueToken.deleteMany({
        where: { farmerId: u.id },
      }).catch(() => {});
      await (prisma as any).notification.deleteMany({
        where: { userId: u.id },
      }).catch(() => {});
      await (prisma as any).auditLog?.deleteMany({
        where: { userId: u.id },
      }).catch(() => {});
      await (prisma as any).user.delete({
        where: { id: u.id },
      }).catch(() => {});
      logger.success(`✅ Removed seeded farmer data: ${u.email}`);
    }
  } catch (err: any) {
    logger.warn('Ramesh cleanup note:', err.message);
  }
}

// 6. Start Server
async function start() {
  logger.info('Starting Smart Farmer Assistance Server...');
  await checkDatabaseConnection();
  await cleanupRameshData();
  await ensureComprehensiveDemoData();

  server.listen(ENV.PORT, () => {
    logger.success(`🚀 Server running on http://localhost:${ENV.PORT}`);
    logger.info(`🔌 WebSocket Server active on port ${ENV.PORT}`);
    logger.info(`🌍 Environment: ${ENV.NODE_ENV}`);
    startTelegramBotListener();
  });
}

start().catch((err) => {
  logger.error('Fatal startup error:', err);
  process.exit(1);
});

export { app, server };
