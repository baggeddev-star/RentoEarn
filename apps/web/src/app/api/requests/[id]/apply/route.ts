import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';
import { ApplicationStatus } from '@prisma/client';
import { z } from 'zod';

const applySchema = z.object({
  message: z.string().max(1000).optional(),
  proposedAmountLamports: z.string().transform((v) => BigInt(v)).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/requests/[id]/apply
 * Apply to a request
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

  if (req.status !== 'OPEN') {
    return NextResponse.json(
      { success: false, error: 'Request is closed' },
      { status: 400 }
    );
  }

  // Can't apply to your own request
  if (req.createdByWallet === auth.wallet) {
    return NextResponse.json(
      { success: false, error: 'Cannot apply to your own request' },
      { status: 400 }
    );
  }

  // For SPONSOR_BUY requests, applicant must be a verified creator
  if (req.type === 'SPONSOR_BUY') {
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { wallet: auth.wallet },
    });

    if (!creatorProfile || !creatorProfile.verified) {
      return NextResponse.json(
        { success: false, error: 'Verified X account required to apply' },
        { status: 403 }
      );
    }
  }

  // Check if already applied
  const existingApplication = await prisma.requestApplication.findUnique({
    where: {
      requestId_applicantWallet: {
        requestId: id,
        applicantWallet: auth.wallet,
      },
    },
  });

  if (existingApplication) {
    return NextResponse.json(
      { success: false, error: 'Already applied to this request' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const validated = applySchema.parse(body);

    const application = await prisma.requestApplication.create({
      data: {
        requestId: id,
        applicantWallet: auth.wallet,
        message: validated.message,
        proposedAmountLamports: validated.proposedAmountLamports,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...application,
        proposedAmountLamports: application.proposedAmountLamports?.toString() || null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Apply error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
