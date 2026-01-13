import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/stats
 * Get platform statistics
 */
export async function GET() {
  try {
    // Get various stats from the database
    const [
      totalListings,
      totalCampaigns,
      completedCampaigns,
      activeCampaigns,
      totalRequests,
    ] = await Promise.all([
      prisma.listing.count({ where: { active: true } }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: { in: ['EXPIRED', 'CLAIMED'] } } }),
      prisma.campaign.count({ where: { status: 'LIVE' } }),
      prisma.request.count({ where: { status: 'OPEN' } }),
    ]);

    // Calculate total volume (sum of all campaign amounts)
    const volumeResult = await prisma.campaign.aggregate({
      _sum: {
        amountLamports: true,
      },
      where: {
        status: { in: ['LIVE', 'EXPIRED', 'CLAIMED'] },
      },
    });

    const totalVolumeLamports = volumeResult._sum.amountLamports || BigInt(0);

    // Calculate locked value (campaigns that are live)
    const lockedResult = await prisma.campaign.aggregate({
      _sum: {
        amountLamports: true,
      },
      where: {
        status: 'LIVE',
      },
    });

    const lockedLamports = lockedResult._sum.amountLamports || BigInt(0);

    // Get 24h volume (campaigns created in last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const volume24hResult = await prisma.campaign.aggregate({
      _sum: {
        amountLamports: true,
      },
      where: {
        createdAt: { gte: yesterday },
        status: { in: ['DEPOSITED', 'LIVE', 'EXPIRED', 'CLAIMED'] },
      },
    });

    const volume24hLamports = volume24hResult._sum.amountLamports || BigInt(0);

    return NextResponse.json({
      success: true,
      data: {
        totalListings,
        totalCampaigns,
        completedCampaigns,
        activeCampaigns,
        totalRequests,
        totalVolumeLamports: totalVolumeLamports.toString(),
        lockedLamports: lockedLamports.toString(),
        volume24hLamports: volume24hLamports.toString(),
        // Formatted for display
        formatted: {
          totalVolumeSol: (Number(totalVolumeLamports) / 1_000_000_000).toFixed(2),
          lockedSol: (Number(lockedLamports) / 1_000_000_000).toFixed(2),
          volume24hSol: (Number(volume24hLamports) / 1_000_000_000).toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
