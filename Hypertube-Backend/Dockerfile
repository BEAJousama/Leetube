# Build stage
FROM node:22-alpine AS builder

WORKDIR /app
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm and dependencies
RUN npm install -g pnpm@9
RUN pnpm config set ignore-scripts false
RUN pnpm install --no-frozen-lockfile

# Copy Prisma schema first
COPY ./prisma ./prisma

# Generate Prisma client
RUN pnpm prisma generate


# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app
RUN apk add --no-cache openssl

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S hypertube -u 1001

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Copy prisma schema for client generation
COPY ./prisma ./prisma

# Install pnpm and production dependencies only
RUN npm install -g pnpm@9
RUN pnpm config set ignore-scripts false
RUN pnpm install --no-frozen-lockfile --prod
RUN pnpm prisma generate

# Copy built application from builder stage
COPY --from=builder --chown=hypertube:nodejs /app/dist ./dist

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/downloads
RUN chown -R hypertube:nodejs /app

# Switch to non-root user
USER hypertube

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
