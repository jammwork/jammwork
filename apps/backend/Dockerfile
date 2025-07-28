# Multi-stage build for smaller image size
# Stage 1: Build stage
FROM node:24-alpine AS builder

# Install pnpm
RUN corepack enable pnpm

# Set working directory
WORKDIR /app

# Copy workspace files for dependency installation
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy backend app package.json
COPY apps/backend/package.json ./apps/backend/

# Copy any shared packages package.json files first
COPY packages/ ./packages/

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy workspace config files
COPY tsconfig.base.json nx.json* ./

# Copy backend source code
COPY apps/backend/ ./apps/backend/

# Build the backend application
RUN pnpm --filter backend build

# Stage 2: Production stage
FROM node:24-alpine AS production

# Install pnpm
RUN corepack enable pnpm

# Set working directory
WORKDIR /app

# Copy only backend package.json for production dependencies
COPY apps/backend/package.json ./

# Install only backend production dependencies (without lockfile since we only have one package)
RUN pnpm install --prod

# Copy built application from builder stage
COPY --from=builder /app/apps/backend/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Change ownership of the app directory
RUN chown -R backend:nodejs /app

# Switch to non-root user
USER backend

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]