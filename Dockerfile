FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Copy all files
COPY . .

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Build the web app
WORKDIR /app/apps/web
RUN pnpm prisma generate
RUN pnpm build

# Start script: run migrations then start app
CMD pnpm prisma db push --skip-generate && pnpm start
