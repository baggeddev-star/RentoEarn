interface VerificationLog {
  id: string;
  checkedAt: string;
  headerOk: boolean;
  hashDistance: number;
  headerUrl?: string | null;
  notes?: string | null;
}

interface VerificationLogsProps {
  logs: VerificationLog[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function VerificationLogs({ logs }: VerificationLogsProps) {
  if (logs.length === 0) {
    return (
      <div className="border border-white/10 p-6">
        <h3 className="text-sm text-white/40 font-mono uppercase mb-6">Verification Logs</h3>
        <p className="text-sm text-white/40">No verification logs yet.</p>
      </div>
    );
  }

  return (
    <div className="border border-white/10 p-6">
      <h3 className="text-sm text-white/40 font-mono uppercase mb-6">
        Verification Logs ({logs.length})
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`p-4 border ${
              log.headerOk
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-red-500/30 bg-red-500/5'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-mono ${log.headerOk ? 'text-green-400' : 'text-red-400'}`}>
                  {log.headerOk ? '✓ MATCH' : '✗ MISMATCH'}
                </span>
                <span className="text-xs text-white/40 font-mono">
                  DIST: {log.hashDistance}
                </span>
              </div>
              <span className="text-xs text-white/40 font-mono">
                {formatDate(log.checkedAt)}
              </span>
            </div>
            {log.notes && (
              <p className="text-xs text-white/50">{log.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
