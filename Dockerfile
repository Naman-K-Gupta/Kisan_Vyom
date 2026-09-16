# Multi-stage production build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root manifests and package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies across all workspaces
RUN npm ci

# Copy entire source code
COPY . .

# Build shared, server, and client
RUN npm run build

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package manifests
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled assets from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/client/dist ./client/dist

# Expose server port
EXPOSE 5000

# Start server
CMD ["node", "server/dist/server.js"]
