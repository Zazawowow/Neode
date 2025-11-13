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
RUN echo "Starting Vite build..." && \
    npm run build || (echo "ERROR: npm run build failed!" && exit 1) && \
    echo "Build complete. Checking dist directory..." && \
    ls -la . && \
    echo "Listing dist contents:" && \
    ls -la dist/ && \
    echo "Checking index.html exists:" && \
    test -f dist/index.html && echo "✓ index.html found" || (echo "✗ index.html NOT found" && exit 1)

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Verify files were copied
RUN echo "Files in nginx html directory:" && \
    ls -la /usr/share/nginx/html/ && \
    echo "Checking index.html:" && \
    test -f /usr/share/nginx/html/index.html && echo "✓ index.html present" || echo "✗ index.html MISSING"

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
