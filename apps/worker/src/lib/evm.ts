/**
 * Server-side EVM client for worker operations.
 * Uses platform wallet private key to sign transactions.
 */

import { ethers } from 'ethers';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
const PLATFORM_WALLET_PRIVATE_KEY = process.env.PLATFORM_WALLET_PRIVATE_KEY || '';

const BILLBOARD_MARKET_ABI = [
  'function platformSetVerifying(uint256 campaignId) external',
  'function platformSetLive(uint256 campaignId, uint64 startTs, uint64 endTs) external',
  'function platformSetExpired(uint256 campaignId) external',
  'function platformHardCancelAndRefund(uint256 campaignId) external',
  'function getCampaign(uint256 campaignId) external view returns (tuple(uint256 campaignId, address sponsor, address creator, uint256 amount, uint256 duration, uint8 state, uint64 startTs, uint64 endTs))',
];

export class WorkerEVMClient {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    if (!PLATFORM_WALLET_PRIVATE_KEY) {
      throw new Error('PLATFORM_WALLET_PRIVATE_KEY environment variable is required');
    }
    if (!CONTRACT_ADDRESS) {
      throw new Error('CONTRACT_ADDRESS environment variable is required');
    }

    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.wallet = new ethers.Wallet(PLATFORM_WALLET_PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, BILLBOARD_MARKET_ABI, this.wallet);
  }

  /**
   * Set campaign to VERIFYING state
   */
  async setVerifying(campaignId: bigint): Promise<string> {
    console.log(`[EVM] Setting campaign ${campaignId} to VERIFYING...`);
    const tx = await this.contract.platformSetVerifying(campaignId);
    const receipt = await tx.wait();
    console.log(`[EVM] setVerifying tx: ${receipt.hash}`);
    return receipt.hash;
  }

  /**
   * Set campaign to LIVE state
   */
  async setLive(campaignId: bigint, startTs: number, endTs: number): Promise<string> {
    console.log(`[EVM] Setting campaign ${campaignId} to LIVE (${startTs} - ${endTs})...`);
    const tx = await this.contract.platformSetLive(campaignId, startTs, endTs);
    const receipt = await tx.wait();
    console.log(`[EVM] setLive tx: ${receipt.hash}`);
    return receipt.hash;
  }

  /**
   * Set campaign to EXPIRED state
   */
  async setExpired(campaignId: bigint): Promise<string> {
    console.log(`[EVM] Setting campaign ${campaignId} to EXPIRED...`);
    const tx = await this.contract.platformSetExpired(campaignId);
    const receipt = await tx.wait();
    console.log(`[EVM] setExpired tx: ${receipt.hash}`);
    return receipt.hash;
  }

  /**
   * Hard cancel campaign and refund sponsor
   */
  async hardCancelAndRefund(campaignId: bigint): Promise<string> {
    console.log(`[EVM] Hard canceling campaign ${campaignId} and refunding...`);
    const tx = await this.contract.platformHardCancelAndRefund(campaignId);
    const receipt = await tx.wait();
    console.log(`[EVM] hardCancelAndRefund tx: ${receipt.hash}`);
    return receipt.hash;
  }

  /**
   * Get campaign data from contract
   */
  async getCampaign(campaignId: bigint) {
    return this.contract.getCampaign(campaignId);
  }

  /**
   * Get platform wallet address
   */
  getAddress(): string {
    return this.wallet.address;
  }
}

let clientInstance: WorkerEVMClient | null = null;

export function getWorkerEVMClient(): WorkerEVMClient {
  if (!clientInstance) {
    clientInstance = new WorkerEVMClient();
  }
  return clientInstance;
}
