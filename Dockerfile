FROM node:20-alpine

WORKDIR /app

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

# Start
CMD ["pnpm", "start"]
