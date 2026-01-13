import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';
import { CampaignStatus, SlotType } from '@prisma/client';
import { z } from 'zod';

// Validation schema for creating a campaign from a listing
const createCampaignSchema = z.object({
  listingId: z.string().optional(),
  requestId: z.string().optional(),
  creatorWallet: z.string(),
  slotType: z.enum(['HEADER', 'BIO']),
  durationSeconds: z.number().int().positive(),
  amountLamports: z.string().transform((v) => BigInt(v)),
  requiredBioSubstring: z.string().optional(),
});

/**
 * GET /api/campaigns
 * Get campaigns with filtering
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sponsorWallet = searchParams.get('sponsorWallet');
  const creatorWallet = searchParams.get('creatorWallet');
  const status = searchParams.get('status') as CampaignStatus | null;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: Record<string, unknown> = {};

  if (sponsorWallet) {
    where.sponsorWallet = sponsorWallet;
  }

  if (creatorWallet) {
    where.creatorWallet = creatorWallet;
  }

  if (status) {
    where.status = status;
  }

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        listing: {
          include: {
            creator: {
              select: {
                xUsername: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        verificationLogs: {
          orderBy: { checkedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  // Serialize BigInt
  const serialized = campaigns.map((c) => ({
    ...c,
    chainCampaignId: c.chainCampaignId?.toString() || null,
    amountLamports: c.amountLamports.toString(),
    listing: c.listing
      ? {
          ...c.listing,
          price24hLamports: c.listing.price24hLamports.toString(),
          price7dLamports: c.listing.price7dLamports.toString(),
          price30dLamports: c.listing.price30dLamports.toString(),
        }
      : null,
  }));

  return NextResponse.json({
    success: true,
    data: {
      campaigns: serialized,
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
 * POST /api/campaigns
 * Create a new campaign (sponsor initiates)
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
    const validated = createCampaignSchema.parse(body);

    // Generate a unique chain campaign ID
    const chainCampaignId = BigInt(Date.now());

    const campaign = await prisma.campaign.create({
      data: {
        chainCampaignId,
        listingId: validated.listingId,
        requestId: validated.requestId,
        sponsorWallet: auth.wallet,
        creatorWallet: validated.creatorWallet,
        slotType: validated.slotType as SlotType,
        durationSeconds: validated.durationSeconds,
        amountLamports: validated.amountLamports,
        requiredBioSubstring: validated.requiredBioSubstring,
        status: 'DRAFT',
      },
    });

    // Create notification for creator
    await prisma.notification.create({
      data: {
        wallet: validated.creatorWallet,
        type: 'CAMPAIGN_CREATED',
        title: 'New Campaign Request',
        body: `A sponsor wants to book your ${validated.slotType.toLowerCase()} slot.`,
        metadata: JSON.stringify({ campaignId: campaign.id }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        chainCampaignId: campaign.chainCampaignId?.toString() || null,
        amountLamports: campaign.amountLamports.toString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Create campaign error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
