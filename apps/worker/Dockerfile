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

# Set working directory to worker
WORKDIR /app/apps/worker

# Run directly with tsx (no build step needed)
CMD ["npx", "tsx", "src/index.ts"]
