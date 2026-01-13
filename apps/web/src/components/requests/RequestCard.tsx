import Link from 'next/link';
import { StatusChip } from '../ui/StatusChip';

interface RequestCardProps {
  request: {
    id: string;
    type: string;
    title: string;
    description: string;
    slotTypes: string[];
    durationSeconds: number;
    amountLamports: string;
    status: string;
    maxWinners?: number | null;
    createdByWallet: string;
    _count?: {
      applications: number;
      campaigns: number;
    };
  };
}

function formatSol(lamports: string): string {
  return (Number(lamports) / 1_000_000_000).toFixed(2);
}

function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  if (days >= 30) return `${Math.floor(days / 30)} month`;
  if (days >= 7) return `${Math.floor(days / 7)} week`;
  return `${days} day`;
}

export function RequestCard({ request }: RequestCardProps) {
  const isSponsorRequest = request.type === 'SPONSOR_BUY';

  return (
    <Link href={`/requests/${request.id}`}>
      <div className="group border border-white/20 bg-black p-6 h-full flex flex-col hover:border-white/50 hover:bg-white/5 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className={`
            px-3 py-1 border text-xs font-mono uppercase
            ${isSponsorRequest 
              ? 'border-blue-500/50 text-blue-400' 
              : 'border-purple-500/50 text-purple-400'
            }
          `}>
            {isSponsorRequest ? 'SPONSOR' : 'CREATOR'}
          </span>
          <StatusChip status={request.status} size="sm" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
          {request.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-white/50 mb-4 line-clamp-2 flex-1">
          {request.description}
        </p>

        {/* Details */}
        <div className="flex flex-wrap gap-2 mb-4">
          {request.slotTypes.map((slot) => (
            <span
              key={slot}
              className="px-2 py-1 border border-white/10 text-xs text-white/60 font-mono"
            >
              {slot}
            </span>
          ))}
          <span className="px-2 py-1 border border-white/10 text-xs text-white/60 font-mono">
            {formatDuration(request.durationSeconds)}
          </span>
          {request.maxWinners && request.maxWinners > 1 && (
            <span className="px-2 py-1 border border-white/10 text-xs text-white/60 font-mono">
              {request.maxWinners} slots
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div>
            <span className="text-xl font-bold text-white tabular-nums">{formatSol(request.amountLamports)}</span>
            <span className="text-white/40 ml-1">◎</span>
          </div>
          {request._count && (
            <span className="text-sm text-white/40 font-mono">
              {request._count.applications} applied
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
