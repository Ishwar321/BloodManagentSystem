# Multi-stage build for production
FROM node:18-alpine AS backend

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY . .

# Build frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production && npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy backend dependencies and source
COPY --from=backend /app/node_modules ./node_modules
COPY --from=backend /app/package*.json ./
COPY --from=backend /app/server.js ./
COPY --from=backend /app/config ./config
COPY --from=backend /app/controllers ./controllers
COPY --from=backend /app/middleware ./middleware
COPY --from=backend /app/middlewares ./middlewares
COPY --from=backend /app/models ./models
COPY --from=backend /app/routes ./routes
COPY --from=backend /app/utils ./utils

# Copy built frontend
COPY --from=backend /app/client/build ./client/build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bloodbank -u 1001
USER bloodbank

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/v1/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["npm", "start"]
