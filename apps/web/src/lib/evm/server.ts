/**
 * Server-side EVM client for web app API routes.
 * Uses platform wallet private key to sign transactions.
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { BILLBOARD_MARKET_ABI } from './abi';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS as `0x${string}`;
const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
const PLATFORM_WALLET_PRIVATE_KEY = process.env.PLATFORM_WALLET_PRIVATE_KEY;

export function getPublicClient() {
  return createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL),
  });
}

export function getPlatformWalletClient() {
  if (!PLATFORM_WALLET_PRIVATE_KEY) {
    throw new Error('PLATFORM_WALLET_PRIVATE_KEY environment variable is required');
  }

  const account = privateKeyToAccount(`0x${PLATFORM_WALLET_PRIVATE_KEY}`);
  
  return createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(RPC_URL),
  });
}

export function getPlatformAddress(): `0x${string}` {
  if (!PLATFORM_WALLET_PRIVATE_KEY) {
    throw new Error('PLATFORM_WALLET_PRIVATE_KEY environment variable is required');
  }
  const account = privateKeyToAccount(`0x${PLATFORM_WALLET_PRIVATE_KEY}`);
  return account.address;
}

/**
 * Set campaign to VERIFYING state
 */
export async function setVerifying(campaignId: bigint): Promise<`0x${string}`> {
  const walletClient = getPlatformWalletClient();
  const publicClient = getPublicClient();

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: BILLBOARD_MARKET_ABI,
    functionName: 'platformSetVerifying',
    args: [campaignId],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/**
 * Set campaign to LIVE state
 */
export async function setLive(
  campaignId: bigint,
  startTs: number,
  endTs: number
): Promise<`0x${string}`> {
  const walletClient = getPlatformWalletClient();
  const publicClient = getPublicClient();

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: BILLBOARD_MARKET_ABI,
    functionName: 'platformSetLive',
    args: [campaignId, BigInt(startTs), BigInt(endTs)],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/**
 * Set campaign to EXPIRED state
 */
export async function setExpired(campaignId: bigint): Promise<`0x${string}`> {
  const walletClient = getPlatformWalletClient();
  const publicClient = getPublicClient();

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: BILLBOARD_MARKET_ABI,
    functionName: 'platformSetExpired',
    args: [campaignId],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/**
 * Hard cancel campaign and refund sponsor
 */
export async function hardCancelAndRefund(campaignId: bigint): Promise<`0x${string}`> {
  const walletClient = getPlatformWalletClient();
  const publicClient = getPublicClient();

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: BILLBOARD_MARKET_ABI,
    functionName: 'platformHardCancelAndRefund',
    args: [campaignId],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/**
 * Get campaign data from contract
 */
export async function getCampaign(campaignId: bigint) {
  const publicClient = getPublicClient();
  
  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: BILLBOARD_MARKET_ABI,
    functionName: 'getCampaign',
    args: [campaignId],
  });
}

export { formatEther, parseEther };
