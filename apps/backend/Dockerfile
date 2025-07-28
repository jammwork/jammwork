# Use Node.js 20 LTS Alpine with pnpm
FROM node:24-alpine

# Install pnpm
RUN corepack enable pnpm

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy backend app package.json
COPY apps/backend/package.json ./apps/backend/

# Copy any shared packages
COPY packages/ ./packages/

# Install dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Copy backend source code
COPY apps/backend/ ./apps/backend/

# Copy workspace config files if they exist
COPY tsconfig.base.json nx.json* ./

# Build the backend application
RUN pnpm --filter backend build

# Expose the port the app runs on
EXPOSE 3000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Change ownership of the app directory
RUN chown -R backend:nodejs /app
USER backend

# Change working directory to backend app
WORKDIR /app/apps/backend

# Start the application
CMD ["pnpm", "start"]