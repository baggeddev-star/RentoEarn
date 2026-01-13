import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';
import { getStorage } from '@/lib/storage';

/**
 * GET /api/banner/download?campaignId=xxx
 * Download the banner image for a campaign.
 * Only the creator or sponsor of the campaign can download.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const campaignId = request.nextUrl.searchParams.get('campaignId');

  if (!campaignId) {
    return NextResponse.json(
      { success: false, error: 'Campaign ID required' },
      { status: 400 }
    );
  }

  // Fetch campaign
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    return NextResponse.json(
      { success: false, error: 'Campaign not found' },
      { status: 404 }
    );
  }

  // Only creator or sponsor can download
  if (campaign.creatorWallet !== auth.wallet && campaign.sponsorWallet !== auth.wallet) {
    return NextResponse.json(
      { success: false, error: 'Only campaign participants can download banner' },
      { status: 403 }
    );
  }

  if (!campaign.expectedBannerUrl) {
    return NextResponse.json(
      { success: false, error: 'No banner uploaded for this campaign' },
      { status: 404 }
    );
  }

  try {
    // Try to download from storage first (for local storage)
    const storage = getStorage();
    const key = `banners/${campaignId}/canonical.jpg`;
    
    let imageBuffer: Buffer;
    
    try {
      // Try local storage
      imageBuffer = await storage.download(key);
    } catch {
      // Fall back to fetching from URL
      const response = await fetch(campaign.expectedBannerUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch banner');
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    // Return the image with download headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="billboard-banner-${campaignId.slice(0, 8)}.jpg"`,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Banner download error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download banner' },
      { status: 500 }
    );
  }
}
