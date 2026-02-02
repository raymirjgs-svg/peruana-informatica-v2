# ============================================
# 🐳 Backend Dockerfile - LOCAL DEVELOPMENT
# ============================================
FROM node:20-alpine

# Install basic utilities for healthcheck and debugging
RUN apk add --no-cache wget curl bash

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for hot-reload)
RUN npm install

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p /app/public/uploads

# Expose backend port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start development server with hot-reload
CMD ["npm", "run", "dev"]
