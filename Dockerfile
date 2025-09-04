# Multi-stage build for Neode Web UI
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY web/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy web source code
COPY web/ ./

# Build the UI application
RUN npm run build:ui

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist/raw/ui /usr/share/nginx/html

# Copy assets
COPY --from=builder /app/projects/shared/assets /usr/share/nginx/html/assets

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
