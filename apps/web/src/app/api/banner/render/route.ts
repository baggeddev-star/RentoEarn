import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { renderBanner } from '@/lib/banner';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/banner/render
 * Upload creative and render canonical banner
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
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const campaignId = formData.get('campaignId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Image file required' },
        { status: 400 }
      );
    }

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID required' },
        { status: 400 }
      );
    }

    // Verify campaign ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.sponsorWallet !== auth.wallet) {
      return NextResponse.json(
        { success: false, error: 'Only sponsor can upload banner' },
        { status: 403 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Render banner
    const result = await renderBanner({
      campaignId,
      inputBuffer: buffer,
    });

    // Update campaign with banner info
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        expectedBannerUrl: result.url,
        expectedSha256: result.sha256,
        expectedHash: result.perceptualHash,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Banner render error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to render banner' },
      { status: 500 }
    );
  }
}
