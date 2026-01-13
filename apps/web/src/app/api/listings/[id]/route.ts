import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';
import { z } from 'zod';

// Validation schema for updating a listing
const updateListingSchema = z.object({
  price24hLamports: z.string().transform((v) => BigInt(v)).optional(),
  price7dLamports: z.string().transform((v) => BigInt(v)).optional(),
  price30dLamports: z.string().transform((v) => BigInt(v)).optional(),
  requiresApproval: z.boolean().optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/listings/[id]
 * Get a single listing by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          xUsername: true,
          displayName: true,
          avatarUrl: true,
          verified: true,
        },
      },
      campaigns: {
        where: {
          status: {
            in: ['LIVE', 'VERIFYING'],
          },
        },
        select: {
          id: true,
          status: true,
          startAt: true,
          endAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!listing) {
    return NextResponse.json(
      { success: false, error: 'Listing not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      ...listing,
      price24hLamports: listing.price24hLamports.toString(),
      price7dLamports: listing.price7dLamports.toString(),
      price30dLamports: listing.price30dLamports.toString(),
    },
  });
}

/**
 * PATCH /api/listings/[id]
 * Update a listing (owner only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check ownership
  const listing = await prisma.listing.findUnique({
    where: { id },
  });

  if (!listing) {
    return NextResponse.json(
      { success: false, error: 'Listing not found' },
      { status: 404 }
    );
  }

  if (listing.creatorWallet !== auth.wallet) {
    return NextResponse.json(
      { success: false, error: 'Not authorized to update this listing' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validated = updateListingSchema.parse(body);

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(validated.price24hLamports && { price24hLamports: validated.price24hLamports }),
        ...(validated.price7dLamports && { price7dLamports: validated.price7dLamports }),
        ...(validated.price30dLamports && { price30dLamports: validated.price30dLamports }),
        ...(validated.requiresApproval !== undefined && { requiresApproval: validated.requiresApproval }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.active !== undefined && { active: validated.active }),
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
        ...updated,
        price24hLamports: updated.price24hLamports.toString(),
        price7dLamports: updated.price7dLamports.toString(),
        price30dLamports: updated.price30dLamports.toString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Update listing error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/listings/[id]
 * Deactivate a listing (owner only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check ownership
  const listing = await prisma.listing.findUnique({
    where: { id },
  });

  if (!listing) {
    return NextResponse.json(
      { success: false, error: 'Listing not found' },
      { status: 404 }
    );
  }

  if (listing.creatorWallet !== auth.wallet) {
    return NextResponse.json(
      { success: false, error: 'Not authorized to delete this listing' },
      { status: 403 }
    );
  }

  // Soft delete by deactivating
  await prisma.listing.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({
    success: true,
    data: { message: 'Listing deactivated' },
  });
}
