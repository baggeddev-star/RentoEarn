import { parseEther, formatEther } from 'viem';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
export const BASE_SEPOLIA_CHAIN_ID = 84532;

export enum CampaignState {
  Deposited = 0,
  Approved = 1,
  Verifying = 2,
  Live = 3,
  Expired = 4,
  Refunded = 5,
  CanceledHard = 6,
}

export function getCampaignStateString(state: number): string {
  switch (state) {
    case CampaignState.Deposited: return 'DEPOSITED';
    case CampaignState.Approved: return 'APPROVED';
    case CampaignState.Verifying: return 'VERIFYING';
    case CampaignState.Live: return 'LIVE';
    case CampaignState.Expired: return 'EXPIRED';
    case CampaignState.Refunded: return 'REFUNDED';
    case CampaignState.CanceledHard: return 'CANCELED_HARD';
    default: return 'UNKNOWN';
  }
}

export function formatEth(wei: bigint | string): string {
  const weiValue = typeof wei === 'string' ? BigInt(wei) : wei;
  const eth = Number(formatEther(weiValue));
  return eth.toFixed(eth < 1 ? 4 : 2);
}

export function ethToWei(eth: number): bigint {
  return parseEther(eth.toString());
}

export { BILLBOARD_MARKET_ABI } from './abi';
