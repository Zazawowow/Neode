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

# Show environment for debugging
RUN echo "=== Environment Check ===" && \
    echo "DOCKER_BUILD=$DOCKER_BUILD" && \
    echo "Current directory:" && pwd && \
    echo "Files in current directory:" && ls -la

# Build the Vue application
RUN echo "=== Starting Vite build ===" && \
    npm run build; \
    BUILD_EXIT_CODE=$?; \
    echo "Build exit code: $BUILD_EXIT_CODE"; \
    if [ $BUILD_EXIT_CODE -ne 0 ]; then \
        echo "=== BUILD FAILED ===" && \
        echo "Checking package.json for build script..." && \
        cat package.json | grep -A 3 "scripts" && \
        exit 1; \
    fi

# Verify build output
RUN echo "=== Build verification ===" && \
    echo "Files in current directory:" && ls -la && \
    echo "" && \
    echo "Checking for dist directory..." && \
    if [ -d "dist" ]; then \
        echo "✓ dist directory exists" && \
        ls -la dist/ && \
        if [ -f "dist/index.html" ]; then \
            echo "✓ index.html found"; \
        else \
            echo "✗ index.html NOT found" && exit 1; \
        fi \
    else \
        echo "✗ dist directory does not exist!" && exit 1; \
    fi

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
