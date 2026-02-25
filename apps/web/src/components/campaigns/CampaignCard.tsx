import Link from 'next/link';
import { formatEther } from 'viem';
import { StatusChip } from '../ui/StatusChip';
import { Avatar } from '@/components/ui/Avatar';

interface CampaignCardProps {
  campaign: {
    id: string;
    slotType: string;
    durationSeconds: number;
    amountLamports: string;
    status: string;
    createdAt: string;
    startAt?: string | null;
    endAt?: string | null;
    sponsorWallet: string;
    creatorWallet: string;
    listing?: {
      creator?: {
        xUsername: string;
        displayName: string | null;
        avatarUrl: string | null;
      } | null;
    } | null;
  };
  viewAs: 'sponsor' | 'creator';
}

// Helper to determine if action is needed
function needsAction(status: string, viewAs: 'sponsor' | 'creator'): string | null {
  if (viewAs === 'sponsor') {
    if (status === 'DRAFT') return 'Deposit Required';
  }
  if (viewAs === 'creator') {
    if (status === 'DEPOSITED') return 'Approval Needed';
    if (status === 'EXPIRED') return 'Claim Funds';
  }
  return null;
}

function formatEth(wei: string): string {
  const eth = Number(formatEther(BigInt(wei)));
  if (eth < 0.0001) return eth.toExponential(2);
  if (eth < 0.01) return eth.toFixed(6);
  if (eth < 1) return eth.toFixed(4);
  return eth.toFixed(2);
}

function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  if (days >= 30) return `${Math.floor(days / 30)}mo`;
  if (days >= 7) return `${Math.floor(days / 7)}w`;
  return `${days}d`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function shortenWallet(wallet: string): string {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export function CampaignCard({ campaign, viewAs }: CampaignCardProps) {
  const actionNeeded = needsAction(campaign.status, viewAs);
  
  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <div className={`group border bg-black p-6 hover:bg-white/5 transition-all duration-300 ${
        actionNeeded ? 'border-yellow-500/50 hover:border-yellow-500' : 'border-white/20 hover:border-white/50'
      }`}>
        {/* Action needed banner */}
        {actionNeeded && (
          <div className="mb-4 -mt-2 -mx-2 px-3 py-1.5 bg-yellow-500/10 border-b border-yellow-500/30">
            <span className="text-xs font-mono text-yellow-400">⚡ {actionNeeded}</span>
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 border border-white/30 text-white/80 text-xs font-mono uppercase">
              {campaign.slotType}
            </span>
            <StatusChip status={campaign.status} size="sm" />
          </div>
          <span className="text-xs text-white/40 font-mono">
            {formatDate(campaign.createdAt)}
          </span>
        </div>

        {/* Party info */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar 
            src={campaign.listing?.creator?.avatarUrl}
            alt={campaign.listing?.creator?.displayName || campaign.listing?.creator?.xUsername || ''}
            size="md"
          />
          <div>
            <div className="text-xs text-white/40 uppercase tracking-wider font-mono mb-1">
              {viewAs === 'sponsor' ? 'Creator' : 'Sponsor'}
            </div>
            <div className="font-medium text-white">
              {viewAs === 'sponsor'
                ? campaign.listing?.creator?.displayName ||
                  `@${campaign.listing?.creator?.xUsername || 'unknown'}`
                : shortenWallet(campaign.sponsorWallet)}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-white/40">Duration </span>
            <span className="text-white font-mono">{formatDuration(campaign.durationSeconds)}</span>
          </div>
          <div>
            <span className="text-white/40">Amount </span>
            <span className="font-semibold text-white tabular-nums">{formatEth(campaign.amountLamports)} ETH</span>
          </div>
        </div>

        {/* Progress bar for live campaigns */}
        {campaign.status === 'LIVE' && campaign.startAt && campaign.endAt && (
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex justify-between text-xs text-white/40 font-mono mb-2">
              <span>{formatDate(campaign.startAt)}</span>
              <span>{formatDate(campaign.endAt)}</span>
            </div>
            <div className="h-1 bg-white/10">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    ((Date.now() - new Date(campaign.startAt).getTime()) /
                      (new Date(campaign.endAt).getTime() -
                        new Date(campaign.startAt).getTime())) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
