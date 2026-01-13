import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/requests/[id]
 * Get a single request by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const req = await prisma.request.findUnique({
    where: { id },
    include: {
      applications: {
        include: {
          // Include creator profile for applicants
        },
        orderBy: { createdAt: 'desc' },
      },
      campaigns: {
        select: {
          id: true,
          status: true,
          sponsorWallet: true,
          creatorWallet: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          applications: true,
          campaigns: true,
        },
      },
    },
  });

  if (!req) {
    return NextResponse.json(
      { success: false, error: 'Request not found' },
      { status: 404 }
    );
  }

  // Serialize BigInt
  const serialized = {
    ...req,
    amountLamports: req.amountLamports.toString(),
    applications: req.applications.map((app) => ({
      ...app,
      proposedAmountLamports: app.proposedAmountLamports?.toString() || null,
    })),
  };

  return NextResponse.json({
    success: true,
    data: serialized,
  });
}

/**
 * PATCH /api/requests/[id]
 * Update a request (owner only) - mainly for closing
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

  const req = await prisma.request.findUnique({
    where: { id },
  });

  if (!req) {
    return NextResponse.json(
      { success: false, error: 'Request not found' },
      { status: 404 }
    );
  }

  if (req.createdByWallet !== auth.wallet) {
    return NextResponse.json(
      { success: false, error: 'Not authorized' },
      { status: 403 }
    );
  }

  const body = await request.json();

  const updated = await prisma.request.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.title && { title: body.title }),
      ...(body.description && { description: body.description }),
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      ...updated,
      amountLamports: updated.amountLamports.toString(),
    },
  });
}
