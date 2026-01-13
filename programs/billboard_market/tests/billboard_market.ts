import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BillboardMarket } from "../target/types/billboard_market";
import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";

describe("billboard_market", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BillboardMarket as Program<BillboardMarket>;
  
  // Test accounts
  const sponsor = Keypair.generate();
  const creator = Keypair.generate();
  const platformAuthority = provider.wallet;
  
  let campaignId: anchor.BN;
  let campaignPda: PublicKey;
  let vaultPda: PublicKey;

  before(async () => {
    // Airdrop SOL to sponsor
    const sig = await provider.connection.requestAirdrop(
      sponsor.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Airdrop SOL to creator
    const sig2 = await provider.connection.requestAirdrop(
      creator.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig2);
  });

  it("Creates a campaign and deposits SOL", async () => {
    campaignId = new anchor.BN(Date.now());
    const amount = new anchor.BN(1 * LAMPORTS_PER_SOL);
    const duration = new anchor.BN(86400); // 24 hours

    // Derive PDAs
    [campaignPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("campaign"), campaignId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), campaignId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const sponsorBalanceBefore = await provider.connection.getBalance(sponsor.publicKey);

    await program.methods
      .createCampaignAndDeposit(campaignId, creator.publicKey, amount, duration)
      .accounts({
        sponsor: sponsor.publicKey,
        campaign: campaignPda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([sponsor])
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.campaignId.toString()).to.equal(campaignId.toString());
    expect(campaign.sponsor.toString()).to.equal(sponsor.publicKey.toString());
    expect(campaign.creator.toString()).to.equal(creator.publicKey.toString());
    expect(campaign.amount.toString()).to.equal(amount.toString());
    expect(campaign.state).to.deep.equal({ deposited: {} });

    const vaultBalance = await provider.connection.getBalance(vaultPda);
    expect(vaultBalance).to.be.greaterThan(0);
  });

  it("Creator accepts the campaign", async () => {
    await program.methods
      .creatorAccept()
      .accounts({
        signer: creator.publicKey,
        campaign: campaignPda,
      })
      .signers([creator])
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.state).to.deep.equal({ approved: {} });
  });

  it("Platform sets campaign to verifying", async () => {
    await program.methods
      .platformSetVerifying()
      .accounts({
        platformAuthority: platformAuthority.publicKey,
        campaign: campaignPda,
      })
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.state).to.deep.equal({ verifying: {} });
  });

  it("Platform sets campaign to live", async () => {
    const now = Math.floor(Date.now() / 1000);
    const startTs = new anchor.BN(now);
    const endTs = new anchor.BN(now + 86400); // 24 hours from now

    await program.methods
      .platformSetLive(startTs, endTs)
      .accounts({
        platformAuthority: platformAuthority.publicKey,
        campaign: campaignPda,
      })
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.state).to.deep.equal({ live: {} });
    expect(campaign.startTs.toString()).to.equal(startTs.toString());
    expect(campaign.endTs.toString()).to.equal(endTs.toString());
  });

  it("Platform hard cancels and refunds sponsor", async () => {
    const sponsorBalanceBefore = await provider.connection.getBalance(sponsor.publicKey);

    await program.methods
      .platformHardCancelAndRefund()
      .accounts({
        platformAuthority: platformAuthority.publicKey,
        campaign: campaignPda,
        vault: vaultPda,
        sponsor: sponsor.publicKey,
      })
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.state).to.deep.equal({ canceledHard: {} });

    const sponsorBalanceAfter = await provider.connection.getBalance(sponsor.publicKey);
    expect(sponsorBalanceAfter).to.be.greaterThan(sponsorBalanceBefore);
  });

  describe("Full lifecycle with claim", () => {
    let campaignId2: anchor.BN;
    let campaignPda2: PublicKey;
    let vaultPda2: PublicKey;

    it("Creates, accepts, verifies, goes live, expires, and creator claims", async () => {
      campaignId2 = new anchor.BN(Date.now() + 1);
      const amount = new anchor.BN(0.5 * LAMPORTS_PER_SOL);
      const duration = new anchor.BN(1); // 1 second for testing

      [campaignPda2] = PublicKey.findProgramAddressSync(
        [Buffer.from("campaign"), campaignId2.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [vaultPda2] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), campaignId2.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create campaign
      await program.methods
        .createCampaignAndDeposit(campaignId2, creator.publicKey, amount, duration)
        .accounts({
          sponsor: sponsor.publicKey,
          campaign: campaignPda2,
          vault: vaultPda2,
          systemProgram: SystemProgram.programId,
        })
        .signers([sponsor])
        .rpc();

      // Creator accepts
      await program.methods
        .creatorAccept()
        .accounts({
          signer: creator.publicKey,
          campaign: campaignPda2,
        })
        .signers([creator])
        .rpc();

      // Platform sets verifying
      await program.methods
        .platformSetVerifying()
        .accounts({
          platformAuthority: platformAuthority.publicKey,
          campaign: campaignPda2,
        })
        .rpc();

      // Platform sets live with immediate expiry
      const now = Math.floor(Date.now() / 1000);
      const startTs = new anchor.BN(now - 10);
      const endTs = new anchor.BN(now - 1); // Already expired

      await program.methods
        .platformSetLive(startTs, endTs)
        .accounts({
          platformAuthority: platformAuthority.publicKey,
          campaign: campaignPda2,
        })
        .rpc();

      // Platform sets expired
      await program.methods
        .platformSetExpired()
        .accounts({
          platformAuthority: platformAuthority.publicKey,
          campaign: campaignPda2,
        })
        .rpc();

      const campaignBeforeClaim = await program.account.campaign.fetch(campaignPda2);
      expect(campaignBeforeClaim.state).to.deep.equal({ expired: {} });

      // Creator claims
      const creatorBalanceBefore = await provider.connection.getBalance(creator.publicKey);

      await program.methods
        .creatorClaim()
        .accounts({
          creator: creator.publicKey,
          campaign: campaignPda2,
          vault: vaultPda2,
        })
        .signers([creator])
        .rpc();

      const campaignAfterClaim = await program.account.campaign.fetch(campaignPda2);
      expect(campaignAfterClaim.state).to.deep.equal({ refunded: {} });

      const creatorBalanceAfter = await provider.connection.getBalance(creator.publicKey);
      expect(creatorBalanceAfter).to.be.greaterThan(creatorBalanceBefore);
    });
  });

  describe("Creator rejection flow", () => {
    it("Creator can reject and sponsor gets refund", async () => {
      const campaignId3 = new anchor.BN(Date.now() + 2);
      const amount = new anchor.BN(0.25 * LAMPORTS_PER_SOL);
      const duration = new anchor.BN(86400);

      const [campaignPda3] = PublicKey.findProgramAddressSync(
        [Buffer.from("campaign"), campaignId3.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [vaultPda3] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), campaignId3.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create campaign
      await program.methods
        .createCampaignAndDeposit(campaignId3, creator.publicKey, amount, duration)
        .accounts({
          sponsor: sponsor.publicKey,
          campaign: campaignPda3,
          vault: vaultPda3,
          systemProgram: SystemProgram.programId,
        })
        .signers([sponsor])
        .rpc();

      const sponsorBalanceBefore = await provider.connection.getBalance(sponsor.publicKey);

      // Creator rejects
      await program.methods
        .creatorReject()
        .accounts({
          signer: creator.publicKey,
          campaign: campaignPda3,
          vault: vaultPda3,
          sponsor: sponsor.publicKey,
        })
        .signers([creator])
        .rpc();

      const campaign = await program.account.campaign.fetch(campaignPda3);
      expect(campaign.state).to.deep.equal({ canceledHard: {} });

      const sponsorBalanceAfter = await provider.connection.getBalance(sponsor.publicKey);
      expect(sponsorBalanceAfter).to.be.greaterThan(sponsorBalanceBefore);
    });
  });
});
