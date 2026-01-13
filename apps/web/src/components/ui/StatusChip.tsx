interface StatusChipProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'DRAFT', color: 'border-white/30 text-white/60' },
  DEPOSIT_PENDING: { label: 'PENDING', color: 'border-yellow-500/50 text-yellow-400' },
  DEPOSITED: { label: 'DEPOSITED', color: 'border-yellow-500/50 text-yellow-400' },
  APPROVAL_PENDING: { label: 'AWAITING', color: 'border-yellow-500/50 text-yellow-400' },
  VERIFYING: { label: 'VERIFYING', color: 'border-blue-500/50 text-blue-400' },
  LIVE: { label: 'LIVE', color: 'border-green-500/50 text-green-400' },
  EXPIRED: { label: 'COMPLETE', color: 'border-cyan-500/50 text-cyan-400' },
  FAILED_VERIFICATION: { label: 'FAILED', color: 'border-red-500/50 text-red-400' },
  CANCELED_SOFT: { label: 'CANCELED', color: 'border-red-500/50 text-red-400' },
  CANCELED_HARD: { label: 'CANCELED', color: 'border-red-500/50 text-red-400' },
  REFUNDED: { label: 'REFUNDED', color: 'border-white/30 text-white/60' },
  CLAIMED: { label: 'CLAIMED', color: 'border-purple-500/50 text-purple-400' },
  OPEN: { label: 'OPEN', color: 'border-green-500/50 text-green-400' },
  CLOSED: { label: 'CLOSED', color: 'border-white/30 text-white/60' },
  APPLIED: { label: 'APPLIED', color: 'border-yellow-500/50 text-yellow-400' },
  ACCEPTED: { label: 'ACCEPTED', color: 'border-green-500/50 text-green-400' },
  REJECTED: { label: 'REJECTED', color: 'border-red-500/50 text-red-400' },
};

export function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const config = statusConfig[status] || { label: status, color: 'border-white/30 text-white/60' };
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1';

  return (
    <span className={`
      inline-flex items-center gap-1.5 border font-mono uppercase
      ${config.color} ${sizeClasses}
    `}>
      {status === 'LIVE' && (
        <span className="w-1.5 h-1.5 bg-green-400 animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
