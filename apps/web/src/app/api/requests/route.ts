import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';
import { RequestType, RequestStatus, SlotType } from '@prisma/client';
import { z } from 'zod';

// Validation schema for creating a request
const createRequestSchema = z.object({
  type: z.enum(['SPONSOR_BUY', 'CREATOR_OFFER']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  slotTypes: z.array(z.enum(['HEADER', 'BIO'])).min(1),
  durationSeconds: z.number().int().positive(),
  amountLamports: z.string().transform((v) => BigInt(v)),
  maxWinners: z.number().int().positive().optional(),
  headerImageUrl: z.string().url().optional().nullable(),
});

/**
 * GET /api/requests
 * Get all open requests with optional filtering
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') as RequestType | null;
  const status = searchParams.get('status') as RequestStatus | null;
  const createdByWallet = searchParams.get('createdByWallet');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: Record<string, unknown> = {};

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  } else {
    // Default to open requests
    where.status = 'OPEN';
  }

  if (createdByWallet) {
    where.createdByWallet = createdByWallet;
  }

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      include: {
        applications: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            applications: true,
            campaigns: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.request.count({ where }),
  ]);

  // Serialize BigInt
  const serializedRequests = requests.map((req) => ({
    ...req,
    amountLamports: req.amountLamports.toString(),
  }));

  return NextResponse.json({
    success: true,
    data: {
      requests: serializedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}

/**
 * POST /api/requests
 * Create a new request
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validated = createRequestSchema.parse(body);

    // If it's a creator offer, check for verified creator profile
    if (validated.type === 'CREATOR_OFFER') {
      const creatorProfile = await prisma.creatorProfile.findUnique({
        where: { wallet: auth.wallet },
      });

      if (!creatorProfile || !creatorProfile.verified) {
        return NextResponse.json(
          { success: false, error: 'Verified X account required for creator offers' },
          { status: 403 }
        );
      }
    }

    // For SPONSOR_BUY with HEADER slot, headerImageUrl is required
    if (validated.type === 'SPONSOR_BUY' && validated.slotTypes.includes('HEADER') && !validated.headerImageUrl) {
      return NextResponse.json(
        { success: false, error: 'Header image is required for sponsor requests with header slot' },
        { status: 400 }
      );
    }

    const newRequest = await prisma.request.create({
      data: {
        type: validated.type as RequestType,
        createdByWallet: auth.wallet,
        title: validated.title,
        description: validated.description,
        slotTypes: validated.slotTypes as SlotType[],
        durationSeconds: validated.durationSeconds,
        amountLamports: validated.amountLamports,
        maxWinners: validated.maxWinners,
        headerImageUrl: validated.headerImageUrl,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newRequest,
        amountLamports: newRequest.amountLamports.toString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Create request error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
