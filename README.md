# Billboard Market

A Web3 marketplace for X (Twitter) profile rentals on Solana. Creators monetize their header and bio slots, sponsors reach new audiences, all secured by on-chain escrow with automated verification.

## Features

- **Supply-driven Listings**: Creators list header/bio slots with custom pricing
- **Demand-driven Requests**: Sponsors post requests, creators apply
- **Solana Escrow**: Funds held securely until campaign completion
- **Perceptual Hash Verification**: Automated banner matching using dHash
- **Hard Cancel Enforcement**: One verification mismatch = immediate refund
- **7x Daily Checks**: Continuous compliance monitoring

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Billboard Market                         │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App (apps/web)                                         │
│  ├── API Routes (auth, listings, requests, campaigns)           │
│  ├── UI (React + Tailwind, dark X-like theme)                   │
│  └── Solana Wallet Adapter                                      │
├─────────────────────────────────────────────────────────────────┤
│  BullMQ Worker (apps/worker)                                    │
│  ├── verifyInitial: 2-pass verification before LIVE             │
│  ├── keepAlive: 7x/day checks with HARD CANCEL                  │
│  └── expiry: Mark campaigns complete                            │
├─────────────────────────────────────────────────────────────────┤
│  Anchor Program (programs/billboard_market)                     │
│  ├── create_campaign_and_deposit                                │
│  ├── creator_accept / creator_reject                            │
│  ├── platform_set_verifying / platform_set_live                 │
│  ├── platform_hard_cancel_and_refund                            │
│  └── creator_claim                                              │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure                                                 │
│  ├── PostgreSQL (Prisma ORM)                                    │
│  ├── Redis (BullMQ queues)                                      │
│  └── Storage (local / S3)                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Campaign Lifecycle

```
DRAFT → DEPOSIT_PENDING → DEPOSITED → APPROVAL_PENDING → VERIFYING → LIVE → EXPIRED → CLAIMED
                                   ↓                         ↓        ↓
                              CANCELED_HARD ←────────────────┴────────┘
                              (refund to sponsor)
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Rust & Anchor CLI (for Solana program)
- Solana CLI

### 1. Clone and Install

```bash
git clone <repo>
cd RENTOEARN
pnpm install
```

### 2. Database & Redis Setup (No Docker Required!)

#### Option A: Free Cloud Services (Recommended for low-spec machines)

**PostgreSQL - Use Neon (free tier):**
1. Go to https://neon.tech
2. Create a free account
3. Create a new project
4. Copy the connection string

**Redis - Use Upstash (free tier):**
1. Go to https://upstash.com
2. Create a free account
3. Create a new Redis database
4. Copy the Redis URL

#### Option B: Local Installation

**macOS:**
```bash
# Install with Homebrew
brew install postgresql@16 redis

# Start services
brew services start postgresql@16
brew services start redis

# Create database
createdb billboard_market
```

**Windows:**
- Download PostgreSQL: https://www.postgresql.org/download/windows/
- Download Redis: https://github.com/microsoftarchive/redis/releases
- Or use WSL2 and follow Linux instructions

**Linux (Ubuntu/Debian):**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres createuser --interactive  # create 'billboard' user
sudo -u postgres createdb billboard_market

# Install Redis
sudo apt install redis-server
sudo systemctl start redis-server
```

### 3. Environment Setup

```bash
# Copy example env
cp env.example .env
```

Edit `.env` with your values:

```env
# For Neon (cloud PostgreSQL):
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/billboard_market?sslmode=require

# For local PostgreSQL:
DATABASE_URL=postgresql://billboard:password@localhost:5432/billboard_market

# For Upstash (cloud Redis):
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379

# For local Redis:
REDIS_URL=redis://localhost:6379

# Generate a random JWT secret
JWT_SECRET=your-random-secret-here-make-it-long
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed test data
pnpm db:seed
```

### 5. Start Development

```bash
# Terminal 1: Start Next.js web app
pnpm --filter web dev

# Terminal 2: Start BullMQ worker
pnpm --filter worker dev
```

Visit http://localhost:3000

## Testing the E2E Flow

### 1. Create a Listing (as Creator)

1. Connect wallet (use Phantom or Solflare)
2. Sign in with wallet signature
3. Go to `/dashboard/creator`
4. Create a new listing with pricing

### 2. Book a Slot (as Sponsor)

1. Browse `/listings`
2. Select a listing
3. Choose duration and deposit SOL
4. Wait for creator approval

### 3. Creator Approval

1. Creator sees pending campaign in dashboard
2. Approves the booking
3. Sponsor uploads banner creative

### 4. Apply Banner

1. Creator downloads the generated banner
2. Sets it as their X header
3. Clicks "I Applied It"

### 5. Verification

- System polls X profile every 60s
- Requires 2 consecutive matches
- On success: Campaign goes LIVE

### 6. Keep-Alive Checks

- 7 checks per day (~every 3.4 hours)
- Each check compares live header to expected

### 7. Demo Hard Cancel

```bash
# Using the dev X simulator, trigger a mismatch:
curl -X POST http://localhost:3000/api/dev/x-sim \
  -H "Content-Type: application/json" \
  -d '{"username": "testcreator", "headerMatch": false}'

# Next keep-alive check will detect mismatch and:
# 1. Set status to CANCELED_HARD
# 2. Trigger on-chain refund
# 3. Notify both parties
# 4. Stop all future checks
```

### 8. Claim (Happy Path)

- If campaign reaches end time without issues
- Creator can claim funds from escrow

## Project Structure

```
RENTOEARN/
├── apps/
│   ├── web/                    # Next.js 14 App Router
│   │   ├── src/
│   │   │   ├── app/            # Pages and API routes
│   │   │   ├── components/     # React components
│   │   │   └── lib/            # Utilities
│   │   └── prisma/             # Database schema
│   └── worker/                 # BullMQ worker
│       └── src/
│           ├── jobs/           # Job processors
│           └── lib/            # Shared utilities
├── packages/
│   └── shared/                 # Shared types and constants
└── programs/
    └── billboard_market/       # Anchor program
        ├── src/lib.rs          # Program code
        └── tests/              # Anchor tests
```

## Key Files

| File | Description |
|------|-------------|
| `apps/web/prisma/schema.prisma` | Database schema |
| `apps/web/src/lib/banner/hash.ts` | dHash implementation |
| `apps/web/src/lib/x-provider/` | X API abstraction |
| `apps/worker/src/jobs/keepAlive.ts` | Hard cancel logic |
| `programs/billboard_market/src/lib.rs` | On-chain escrow |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | Required |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `SOLANA_RPC_URL` | Solana RPC endpoint | `http://localhost:8899` |
| `PLATFORM_AUTHORITY_KEYPAIR` | Platform signer keypair | Required |
| `PROGRAM_ID` | Deployed program ID | Required |
| `STORAGE_PROVIDER` | `local` or `s3` | `local` |
| `X_PROVIDER` | `mock` or `rapidapi` | `mock` |
| `RAPIDAPI_KEY` | RapidAPI key for X | Optional |
| `HASH_MAX_DISTANCE` | Max hamming distance | `10` |

## Anchor Program

### Build

```bash
cd programs/billboard_market
anchor build
```

### Test

```bash
anchor test
```

### Deploy

```bash
# Devnet
anchor deploy --provider.cluster devnet

# Update PROGRAM_ID in .env
```

## API Endpoints

### Auth
- `GET /api/auth/nonce` - Get sign-in nonce
- `POST /api/auth/signin` - Verify signature, create session
- `POST /api/auth/signout` - Clear session
- `GET /api/auth/me` - Get current user

### Listings
- `GET /api/listings` - List all
- `POST /api/listings` - Create (creator)
- `GET /api/listings/[id]` - Get one
- `PATCH /api/listings/[id]` - Update (owner)

### Requests
- `GET /api/requests` - List all
- `POST /api/requests` - Create
- `GET /api/requests/[id]` - Get one
- `POST /api/requests/[id]/apply` - Apply

### Campaigns
- `GET /api/campaigns` - List all
- `POST /api/campaigns` - Create
- `GET /api/campaigns/[id]` - Get one
- `POST /api/campaigns/[id]/deposit` - Record deposit
- `POST /api/campaigns/[id]/approve` - Creator approve
- `POST /api/campaigns/[id]/reject` - Creator reject
- `POST /api/campaigns/[id]/applied` - Trigger verification
- `POST /api/campaigns/[id]/claim` - Creator claim

### Dev
- `GET /api/dev/x-sim` - Get mock X state
- `POST /api/dev/x-sim` - Update mock X state

## Verification Logic

### dHash Algorithm

1. Convert image to grayscale
2. Resize to 9x8 pixels
3. Compare adjacent pixels horizontally
4. Generate 64-bit hash
5. Compare using Hamming distance

### Matching

- Distance ≤ `HASH_MAX_DISTANCE` (default 10) = MATCH
- Distance > `HASH_MAX_DISTANCE` = MISMATCH

### Hard Cancel Rule

**NON-NEGOTIABLE**: Any verification mismatch during a LIVE campaign triggers immediate hard cancel:

1. Stop all future checks
2. Mark status = `CANCELED_HARD`
3. Refund ALL funds to sponsor
4. Notify both parties
5. Creator gets nothing

No pause, no grace window, no partial payout.

## License

MIT
