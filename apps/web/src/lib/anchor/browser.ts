/**
 * Client-side Anchor helpers for browser wallet transactions.
 * These are used when the user needs to sign transactions with their wallet.
 */

import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Program ID from deployed contract
const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || '79Za2f2rCStCvfTv74JPhDBS9BEW48mx9gNXaLvgFRdt'
);

/**
 * Derive Campaign PDA
 */
export function getCampaignPDA(campaignId: bigint): [PublicKey, number] {
  const campaignIdBN = new BN(campaignId.toString());
  return PublicKey.findProgramAddressSync(
    [Buffer.from('campaign'), campaignIdBN.toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
}

/**
 * Derive Vault PDA
 */
export function getVaultPDA(campaignId: bigint): [PublicKey, number] {
  const campaignIdBN = new BN(campaignId.toString());
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), campaignIdBN.toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
}

/**
 * Build the create_campaign_and_deposit instruction.
 * This is called by the sponsor to create a campaign and deposit SOL.
 */
export function buildCreateCampaignAndDepositInstruction(
  sponsor: PublicKey,
  campaignId: bigint,
  creator: PublicKey,
  amount: bigint,
  duration: bigint
): TransactionInstruction {
  const [campaignPda] = getCampaignPDA(campaignId);
  const [vaultPda] = getVaultPDA(campaignId);

  // Instruction discriminator for create_campaign_and_deposit
  // Generated from: sha256("global:create_campaign_and_deposit")[0..8]
  const discriminator = Buffer.from([0xc0, 0xb8, 0x4a, 0x77, 0xad, 0xc4, 0x5a, 0x2c]);

  // Encode arguments
  const campaignIdBuf = Buffer.alloc(8);
  campaignIdBuf.writeBigUInt64LE(campaignId);

  const creatorBuf = creator.toBuffer();

  const amountBuf = Buffer.alloc(8);
  amountBuf.writeBigUInt64LE(amount);

  const durationBuf = Buffer.alloc(8);
  durationBuf.writeBigUInt64LE(duration);

  const data = Buffer.concat([discriminator, campaignIdBuf, creatorBuf, amountBuf, durationBuf]);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: sponsor, isSigner: true, isWritable: true },
      { pubkey: campaignPda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * Build the creator_accept instruction.
 * Called by the creator to accept a campaign.
 */
export function buildCreatorAcceptInstruction(
  creator: PublicKey,
  campaignId: bigint
): TransactionInstruction {
  const [campaignPda] = getCampaignPDA(campaignId);

  // Discriminator for creator_accept
  // Generated from: sha256("global:creator_accept")[0..8]
  const discriminator = Buffer.from([0x54, 0x69, 0x87, 0x1b, 0x49, 0x1b, 0x15, 0xdc]);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: creator, isSigner: true, isWritable: false },
      { pubkey: campaignPda, isSigner: false, isWritable: true },
    ],
    data: discriminator,
  });
}

/**
 * Build the creator_reject instruction.
 * Called by the creator to reject a campaign (refund to sponsor).
 */
export function buildCreatorRejectInstruction(
  creator: PublicKey,
  campaignId: bigint,
  sponsor: PublicKey
): TransactionInstruction {
  const [campaignPda] = getCampaignPDA(campaignId);
  const [vaultPda] = getVaultPDA(campaignId);

  // Discriminator for creator_reject
  // Generated from: sha256("global:creator_reject")[0..8]
  const discriminator = Buffer.from([0xb1, 0xf1, 0xc5, 0xb5, 0xdc, 0x28, 0x69, 0xe5]);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: creator, isSigner: true, isWritable: false },
      { pubkey: campaignPda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: sponsor, isSigner: false, isWritable: true },
    ],
    data: discriminator,
  });
}

/**
 * Build the creator_claim instruction.
 * Called by the creator to claim funds after campaign expires.
 */
export function buildCreatorClaimInstruction(
  creator: PublicKey,
  campaignId: bigint
): TransactionInstruction {
  const [campaignPda] = getCampaignPDA(campaignId);
  const [vaultPda] = getVaultPDA(campaignId);

  // Discriminator for creator_claim
  // Generated from: sha256("global:creator_claim")[0..8]
  const discriminator = Buffer.from([0xe5, 0xdb, 0x28, 0x55, 0xab, 0xb7, 0x2d, 0x8e]);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: creator, isSigner: true, isWritable: true },
      { pubkey: campaignPda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
    ],
    data: discriminator,
  });
}

/**
 * Create and send a transaction with wallet signing.
 * Returns the transaction signature.
 */
export async function sendTransaction(
  connection: Connection,
  instruction: TransactionInstruction,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  feePayer: PublicKey
): Promise<string> {
  const transaction = new Transaction().add(instruction);
  transaction.feePayer = feePayer;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signedTransaction = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  
  await connection.confirmTransaction(signature, 'confirmed');
  
  return signature;
}

/**
 * Helper to format lamports to SOL string
 */
export function formatSol(lamports: bigint | number | string): string {
  const lamportsNum = typeof lamports === 'string' ? BigInt(lamports) : BigInt(lamports);
  const sol = Number(lamportsNum) / LAMPORTS_PER_SOL;
  return sol.toFixed(sol < 1 ? 4 : 2);
}

/**
 * Helper to convert SOL to lamports
 */
export function solToLamports(sol: number): bigint {
  return BigInt(Math.floor(sol * LAMPORTS_PER_SOL));
}
