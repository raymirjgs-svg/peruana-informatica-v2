# ============================================
# 🐳 Frontend Dockerfile - LOCAL DEVELOPMENT
# ============================================
FROM node:20-alpine

# Install basic utilities for healthcheck
RUN apk add --no-cache wget curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY . .

# Expose frontend port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start development server with Turbopack (hot-reload)
CMD ["npm", "run", "dev"]
