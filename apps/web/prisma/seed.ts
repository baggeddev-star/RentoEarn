import { PrismaClient, SlotType, RequestType, CampaignStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const sponsorWallet = '9WzDXwBbmPdCBoccfmXvFSR8gcDYqJJJHvDsGvpj8Hq4';
  const creatorWallet = 'FakeCreatorWallet11111111111111111111111111';
  const creator2Wallet = 'FakeCreator2Wallet1111111111111111111111111';

  // Upsert sponsor user
  await prisma.user.upsert({
    where: { wallet: sponsorWallet },
    update: {},
    create: {
      wallet: sponsorWallet,
    },
  });

  // Upsert creator users
  await prisma.user.upsert({
    where: { wallet: creatorWallet },
    update: {},
    create: {
      wallet: creatorWallet,
    },
  });

  await prisma.user.upsert({
    where: { wallet: creator2Wallet },
    update: {},
    create: {
      wallet: creator2Wallet,
    },
  });

  // Create creator profiles
  await prisma.creatorProfile.upsert({
    where: { wallet: creatorWallet },
    update: {},
    create: {
      wallet: creatorWallet,
      xUsername: 'testcreator',
      displayName: 'Test Creator',
      avatarUrl: 'https://pbs.twimg.com/profile_images/default_avatar.png',
      verified: true,
    },
  });

  await prisma.creatorProfile.upsert({
    where: { wallet: creator2Wallet },
    update: {},
    create: {
      wallet: creator2Wallet,
      xUsername: 'creator2',
      displayName: 'Creator Two',
      avatarUrl: 'https://pbs.twimg.com/profile_images/default_avatar.png',
      verified: true,
    },
  });

  // Create sample listings
  const listing1 = await prisma.listing.upsert({
    where: {
      id: 'seed-listing-1',
    },
    update: {},
    create: {
      id: 'seed-listing-1',
      creatorWallet: creatorWallet,
      slotType: SlotType.HEADER,
      price24hLamports: BigInt(100_000_000), // 0.1 SOL
      price7dLamports: BigInt(500_000_000), // 0.5 SOL
      price30dLamports: BigInt(1_500_000_000), // 1.5 SOL
      active: true,
      requiresApproval: true,
      description: 'Premium header slot on a verified crypto influencer account',
    },
  });

  const listing2 = await prisma.listing.upsert({
    where: {
      id: 'seed-listing-2',
    },
    update: {},
    create: {
      id: 'seed-listing-2',
      creatorWallet: creatorWallet,
      slotType: SlotType.BIO,
      price24hLamports: BigInt(50_000_000), // 0.05 SOL
      price7dLamports: BigInt(250_000_000), // 0.25 SOL
      price30dLamports: BigInt(750_000_000), // 0.75 SOL
      active: true,
      requiresApproval: true,
      description: 'Bio link slot - great for project promotion',
    },
  });

  const listing3 = await prisma.listing.upsert({
    where: {
      id: 'seed-listing-3',
    },
    update: {},
    create: {
      id: 'seed-listing-3',
      creatorWallet: creator2Wallet,
      slotType: SlotType.HEADER,
      price24hLamports: BigInt(200_000_000), // 0.2 SOL
      price7dLamports: BigInt(1_000_000_000), // 1 SOL
      price30dLamports: BigInt(3_000_000_000), // 3 SOL
      active: true,
      requiresApproval: false,
      description: 'High-engagement account header - instant approval!',
    },
  });

  // Create sample requests
  const request1 = await prisma.request.upsert({
    where: {
      id: 'seed-request-1',
    },
    update: {},
    create: {
      id: 'seed-request-1',
      type: RequestType.SPONSOR_BUY,
      createdByWallet: sponsorWallet,
      title: 'Looking for 5 creators for NFT launch',
      description: 'Need creators with 10k+ followers to promote our upcoming NFT collection. Header banner required for 7 days.',
      slotTypes: [SlotType.HEADER],
      durationSeconds: 604800, // 7 days
      amountLamports: BigInt(500_000_000), // 0.5 SOL per creator
      maxWinners: 5,
    },
  });

  const request2 = await prisma.request.upsert({
    where: {
      id: 'seed-request-2',
    },
    update: {},
    create: {
      id: 'seed-request-2',
      type: RequestType.CREATOR_OFFER,
      createdByWallet: creatorWallet,
      title: 'Available for 30-day header + bio combo',
      description: 'Offering both header and bio slots for a discounted bundle price. 50k followers, crypto native audience.',
      slotTypes: [SlotType.HEADER, SlotType.BIO],
      durationSeconds: 2592000, // 30 days
      amountLamports: BigInt(2_000_000_000), // 2 SOL for both
      maxWinners: 1,
    },
  });

  console.log('✅ Seed data created:');
  console.log(`   - 3 users (1 sponsor, 2 creators)`);
  console.log(`   - 2 creator profiles`);
  console.log(`   - 3 listings`);
  console.log(`   - 2 requests`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
