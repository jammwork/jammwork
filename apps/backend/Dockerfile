# Use Node.js 20 LTS Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Expose the port the app runs on
EXPOSE 3000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Change ownership of the app directory
RUN chown -R backend:nodejs /app
USER backend

# Start the application
CMD ["npm", "start"]