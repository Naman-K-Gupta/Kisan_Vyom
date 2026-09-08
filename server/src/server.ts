import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';

import { ENV } from './utils/env';
import { logger } from './utils/logger';
import { checkDatabaseConnection } from './utils/prisma';
import { initializeSocketIO } from './sockets/socketHandler';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const server = http.createServer(app);

// 1. Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});
initializeSocketIO(io);

// 2. Global Security & Parsing Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows images to be served to client
  })
);

app.use(
  cors({
    origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
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

// 6. Start Server
async function start() {
  logger.info('Starting Smart Farmer Assistance Server...');
  await checkDatabaseConnection();

  server.listen(ENV.PORT, () => {
    logger.success(`🚀 Server running on http://localhost:${ENV.PORT}`);
    logger.info(`🔌 WebSocket Server active on port ${ENV.PORT}`);
    logger.info(`🌍 Environment: ${ENV.NODE_ENV}`);
  });
}

start().catch((err) => {
  logger.error('Fatal startup error:', err);
  process.exit(1);
});

export { app, server };
