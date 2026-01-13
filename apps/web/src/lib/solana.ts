import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Get Solana connection
 */
export function getConnection(): Connection {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'http://localhost:8899';
  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Validate a Solana public key
 */
export function isValidPublicKey(key: string): boolean {
  try {
    new PublicKey(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format lamports to SOL with specified decimals
 */
export function lamportsToSol(lamports: bigint | number, decimals: number = 4): string {
  const sol = Number(lamports) / 1_000_000_000;
  return sol.toFixed(decimals);
}

/**
 * Format SOL to lamports
 */
export function solToLamports(sol: number): bigint {
  return BigInt(Math.floor(sol * 1_000_000_000));
}

/**
 * Shorten a public key for display
 */
export function shortenPublicKey(key: string, chars: number = 4): string {
  return `${key.slice(0, chars)}...${key.slice(-chars)}`;
}
