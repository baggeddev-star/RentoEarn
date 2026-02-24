/**
 * Server-side Anchor client for worker operations.
 * Uses platform authority keypair to sign transactions.
 */

import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction } from '@solana/web3.js';

// Program ID - deployed on devnet
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID || '79Za2f2rCStCvfTv74JPhDBS9BEW48mx9gNXaLvgFRdt');

/**
 * Convert bigint to little-endian 8-byte buffer
 */
function bigintToLeBuffer(value: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(value);
  return buf;
}

/**
 * Derive Campaign PDA
 */
export function getCampaignPDA(campaignId: bigint): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('campaign'), bigintToLeBuffer(campaignId)],
    PROGRAM_ID
  );
}

/**
 * Derive Vault PDA
 */
export function getVaultPDA(campaignId: bigint): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), bigintToLeBuffer(campaignId)],
    PROGRAM_ID
  );
}

/**
 * Get platform authority keypair from environment
 */
function getPlatformAuthority(): Keypair {
  const keypairStr = process.env.PLATFORM_AUTHORITY_KEYPAIR;
  if (!keypairStr || keypairStr === 'placeholder') {
    throw new Error('PLATFORM_AUTHORITY_KEYPAIR environment variable is required');
  }
  
  try {
    // Parse as JSON array
    const secretKey = JSON.parse(keypairStr);
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } catch {
    throw new Error('Invalid PLATFORM_AUTHORITY_KEYPAIR format');
  }
}

/**
 * Get Solana connection
 */
function getConnection(): Connection {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Billboard Market client for worker operations
 */
export class WorkerAnchorClient {
  private connection: Connection;
  private platformAuthority: Keypair;

  constructor() {
    this.connection = getConnection();
    this.platformAuthority = getPlatformAuthority();
  }

  /**
   * Set campaign to VERIFYING state
   */
  async setVerifying(campaignId: bigint): Promise<string> {
    const [campaignPda] = getCampaignPDA(campaignId);
    
    // Discriminator for platform_set_verifying: sha256("global:platform_set_verifying")[0..8]
    const discriminator = Buffer.from([0xfa, 0xd3, 0x52, 0x79, 0x62, 0x59, 0xdc, 0x1c]);
    
    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: this.platformAuthority.publicKey, isSigner: true, isWritable: false },
        { pubkey: campaignPda, isSigner: false, isWritable: true },
      ],
      data: discriminator,
    });
    
    return this.sendTransaction(ix);
  }

  /**
   * Set campaign to LIVE state
   */
  async setLive(campaignId: bigint, startTs: number, endTs: number): Promise<string> {
    const [campaignPda] = getCampaignPDA(campaignId);
    
    // Discriminator for platform_set_live: sha256("global:platform_set_live")[0..8]
    const discriminator = Buffer.from([0xeb, 0xf8, 0x07, 0xd8, 0xe7, 0xac, 0x48, 0x6c]);
    const startTsBuf = Buffer.alloc(8);
    startTsBuf.writeBigInt64LE(BigInt(startTs));
    const endTsBuf = Buffer.alloc(8);
    endTsBuf.writeBigInt64LE(BigInt(endTs));
    
    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: this.platformAuthority.publicKey, isSigner: true, isWritable: false },
        { pubkey: campaignPda, isSigner: false, isWritable: true },
      ],
      data: Buffer.concat([discriminator, startTsBuf, endTsBuf]),
    });
    
    return this.sendTransaction(ix);
  }

  /**
   * Set campaign to EXPIRED state
   */
  async setExpired(campaignId: bigint): Promise<string> {
    const [campaignPda] = getCampaignPDA(campaignId);
    
    // Discriminator for platform_set_expired: sha256("global:platform_set_expired")[0..8]
    const discriminator = Buffer.from([0x12, 0xb2, 0x36, 0x28, 0xcf, 0xfb, 0xc4, 0x36]);
    
    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: this.platformAuthority.publicKey, isSigner: true, isWritable: false },
        { pubkey: campaignPda, isSigner: false, isWritable: true },
      ],
      data: discriminator,
    });
    
    return this.sendTransaction(ix);
  }

  /**
   * Hard cancel campaign and refund sponsor
   */
  async hardCancelAndRefund(campaignId: bigint, sponsorPubkey: PublicKey): Promise<string> {
    const [campaignPda] = getCampaignPDA(campaignId);
    const [vaultPda] = getVaultPDA(campaignId);
    
    // Discriminator for platform_hard_cancel_and_refund: sha256("global:platform_hard_cancel_and_refund")[0..8]
    const discriminator = Buffer.from([0xbf, 0x6f, 0x57, 0x5b, 0xa2, 0x36, 0x82, 0xc9]);
    
    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: this.platformAuthority.publicKey, isSigner: true, isWritable: false },
        { pubkey: campaignPda, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: sponsorPubkey, isSigner: false, isWritable: true },
      ],
      data: discriminator,
    });
    
    return this.sendTransaction(ix);
  }

  private async sendTransaction(ix: TransactionInstruction): Promise<string> {
    const tx = new Transaction().add(ix);
    tx.feePayer = this.platformAuthority.publicKey;
    
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    
    tx.sign(this.platformAuthority);
    
    const signature = await this.connection.sendRawTransaction(tx.serialize());
    
    await this.connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');
    
    return signature;
  }
}

// Singleton instance
let clientInstance: WorkerAnchorClient | null = null;

export function getWorkerAnchorClient(): WorkerAnchorClient {
  if (!clientInstance) {
    clientInstance = new WorkerAnchorClient();
  }
  return clientInstance;
}
