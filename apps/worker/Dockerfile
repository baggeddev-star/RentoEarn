FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Copy all files (need full monorepo for workspace deps)
COPY . .

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Build the worker
WORKDIR /app/apps/worker
RUN pnpm build

# Start
CMD ["pnpm", "start"]
