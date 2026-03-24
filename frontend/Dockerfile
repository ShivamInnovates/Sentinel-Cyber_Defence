# ========================================================================================
# TRINETRA Cyber Defense Frontend - Production Dockerfile
# ========================================================================================
# Multi-stage build for optimized container size

# Stage 1: Builder - Node.js build environment
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm install

# Copy source code
COPY . .

# Build the Vite application
RUN npm run build

# Stage 2: Runtime - Nginx server
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy built application from builder
COPY --from=builder /app/dist .

# Copy Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user (nginx runs as daemon by default, but we'll be explicit)
RUN chmod -R 755 /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
