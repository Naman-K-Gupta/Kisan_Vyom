import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

let ioInstance: Server | null = null;

export function initializeSocketIO(io: Server) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join user room for targeted notifications & queue updates
    socket.on('join:user', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.info(`Socket ${socket.id} joined room user:${userId}`);
      }
    });

    // Join centre room for live capacity and queue board updates
    socket.on('join:centre', (centreId: string) => {
      if (centreId) {
        socket.join(`centre:${centreId}`);
        logger.info(`Socket ${socket.id} joined room centre:${centreId}`);
      }
    });

    // Leave centre room
    socket.on('leave:centre', (centreId: string) => {
      if (centreId) {
        socket.leave(`centre:${centreId}`);
        logger.info(`Socket ${socket.id} left room centre:${centreId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server | null {
  return ioInstance;
}
