import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string; applicationId: string }>;
}

/**
 * POST /api/requests/[id]/applications/[applicationId]/reject
 * Reject an application (request owner only)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id, applicationId } = await params;
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

  const application = await prisma.requestApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application || application.requestId !== id) {
    return NextResponse.json(
      { success: false, error: 'Application not found' },
      { status: 404 }
    );
  }

  if (application.status !== 'APPLIED') {
    return NextResponse.json(
      { success: false, error: 'Application already processed' },
      { status: 400 }
    );
  }

  // Reject the application
  const updated = await prisma.requestApplication.update({
    where: { id: applicationId },
    data: { status: 'REJECTED' },
  });

  // Create notification for applicant
  await prisma.notification.create({
    data: {
      wallet: application.applicantWallet,
      type: 'APPLICATION_REJECTED',
      title: 'Application Rejected',
      body: `Your application to "${req.title}" was not accepted.`,
      metadata: JSON.stringify({ requestId: id, applicationId }),
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      ...updated,
      proposedAmountLamports: updated.proposedAmountLamports?.toString() || null,
    },
  });
}
