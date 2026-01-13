import { StatusChip } from '../ui/StatusChip';

interface CampaignTimelineProps {
  campaign: {
    status: string;
    createdAt: string;
    startAt?: string | null;
    endAt?: string | null;
    hardCancelAt?: string | null;
    hardCancelReason?: string | null;
  };
}

const steps = [
  { status: ['DRAFT'], label: 'Created' },
  { status: ['DEPOSIT_PENDING', 'DEPOSITED'], label: 'Funded' },
  { status: ['APPROVAL_PENDING'], label: 'Approved' },
  { status: ['VERIFYING'], label: 'Verifying' },
  { status: ['LIVE'], label: 'Live' },
  { status: ['EXPIRED', 'CLAIMED'], label: 'Completed' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CampaignTimeline({ campaign }: CampaignTimelineProps) {
  const isCanceled = ['CANCELED_SOFT', 'CANCELED_HARD', 'FAILED_VERIFICATION'].includes(
    campaign.status
  );

  const currentStepIndex = steps.findIndex((step) =>
    step.status.includes(campaign.status)
  );

  return (
    <div className="border border-white/10 p-6">
      <h3 className="text-sm text-white/40 font-mono uppercase mb-6">Timeline</h3>

      {isCanceled ? (
        <div className="border border-red-500/30 p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-red-400">⚠</span>
            <StatusChip status={campaign.status} />
          </div>
          {campaign.hardCancelReason && (
            <p className="text-sm text-white/60">{campaign.hardCancelReason}</p>
          )}
          {campaign.hardCancelAt && (
            <p className="text-xs text-white/40 mt-2 font-mono">
              Canceled at {formatDate(campaign.hardCancelAt)}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isComplete = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={step.label} className="flex items-center gap-4">
                <div
                  className={`
                    w-3 h-3 flex-shrink-0
                    ${isComplete 
                      ? 'bg-white' 
                      : isCurrent 
                        ? 'bg-white animate-pulse' 
                        : 'border border-white/30'
                    }
                  `}
                />
                <span className={`text-sm ${isCurrent ? 'text-white' : 'text-white/50'}`}>
                  {step.label}
                  {isComplete && <span className="ml-2 text-white/30">✓</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
