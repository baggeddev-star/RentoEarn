import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';
import { SlotType } from '@prisma/client';
import { z } from 'zod';

// Validation schema for creating a listing
const createListingSchema = z.object({
  slotType: z.enum(['HEADER', 'BIO']),
  price24hLamports: z.string().transform((v) => BigInt(v)),
  price7dLamports: z.string().transform((v) => BigInt(v)),
  price30dLamports: z.string().transform((v) => BigInt(v)),
  requiresApproval: z.boolean().default(true),
  description: z.string().optional(),
});

/**
 * GET /api/listings
 * Get all active listings with optional filtering
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slotType = searchParams.get('slotType') as SlotType | null;
  const creatorWallet = searchParams.get('creatorWallet');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: Record<string, unknown> = {
    active: true,
  };

  if (slotType) {
    where.slotType = slotType;
  }

  if (creatorWallet) {
    where.creatorWallet = creatorWallet;
  }

  // Price filtering on 24h price
  if (minPrice || maxPrice) {
    where.price24hLamports = {};
    if (minPrice) {
      (where.price24hLamports as Record<string, bigint>).gte = BigInt(minPrice);
    }
    if (maxPrice) {
      (where.price24hLamports as Record<string, bigint>).lte = BigInt(maxPrice);
    }
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        creator: {
          select: {
            xUsername: true,
            displayName: true,
            avatarUrl: true,
            verified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);

  // Convert BigInt to string for JSON serialization
  const serializedListings = listings.map((listing) => ({
    ...listing,
    price24hLamports: listing.price24hLamports.toString(),
    price7dLamports: listing.price7dLamports.toString(),
    price30dLamports: listing.price30dLamports.toString(),
  }));

  return NextResponse.json({
    success: true,
    data: {
      listings: serializedListings,
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
 * POST /api/listings
 * Create a new listing (creator only)
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check if user has a verified creator profile
  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { wallet: auth.wallet },
  });

  if (!creatorProfile || !creatorProfile.verified) {
    return NextResponse.json(
      { success: false, error: 'Verified X account required. Please verify your account first.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validated = createListingSchema.parse(body);

    const listing = await prisma.listing.create({
      data: {
        creatorWallet: auth.wallet,
        slotType: validated.slotType as SlotType,
        price24hLamports: validated.price24hLamports,
        price7dLamports: validated.price7dLamports,
        price30dLamports: validated.price30dLamports,
        requiresApproval: validated.requiresApproval,
        description: validated.description,
      },
      include: {
        creator: {
          select: {
            xUsername: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...listing,
        price24hLamports: listing.price24hLamports.toString(),
        price7dLamports: listing.price7dLamports.toString(),
        price30dLamports: listing.price30dLamports.toString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Create listing error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
