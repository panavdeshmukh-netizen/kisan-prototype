
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace definitions
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install

# Copy application source code
COPY apps/api ./apps/api

WORKDIR /app/apps/api

# Expose server port
EXPOSE 3000

# Start development server with live-reloading
CMD ["pnpm", "run", "dev"]
