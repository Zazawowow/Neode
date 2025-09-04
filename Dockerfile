# Multi-stage build for Neode Web UI
FROM node:18-alpine AS builder

# Install git for patch-db dependency
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy the entire repository for patch-db dependency
COPY . ./

# Set working directory to web
WORKDIR /app/web

# Install dependencies (including devDependencies for building)
RUN npm ci

# Build the dependencies first
RUN npm run build:deps

# Build the UI application
RUN npm run build:ui

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/web/dist/raw/ui /usr/share/nginx/html

# Copy assets
COPY --from=builder /app/web/projects/shared/assets /usr/share/nginx/html/assets

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
