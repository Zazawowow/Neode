# Multi-stage build for Neode Web UI (Vue 3 + Vite)
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY neode-ui/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY neode-ui/ ./

# Build the Vue application with Docker flag
ENV DOCKER_BUILD=true
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
