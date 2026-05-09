import { useEffect, useState } from 'react';

interface FoundingStatus {
  claimed: number;
  remaining: number;
  total: number;
  deadline: string;
}

interface FoundingSeatCounterProps {
  /** Refresh interval in milliseconds. Default: 60 000 (1 min). Pass 0 to disable polling. */
  pollInterval?: number;
  /** Called when the user clicks the CTA button. */
  onClaimClick?: () => void;
  className?: string;
}

function useFoundingStatus(pollInterval: number) {
  const [status, setStatus] = useState<FoundingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/founding-status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as FoundingStatus;
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load seat status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
    if (pollInterval > 0) {
      const id = setInterval(() => void fetchStatus(), pollInterval);
      return () => clearInterval(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollInterval]);

  return { status, loading, error };
}

function useCountdown(deadline: string | undefined) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!deadline) return;

    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Offer expired'); return; }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setTimeLeft(`${d}d ${h}h ${m}m`);
    };

    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  return timeLeft;
}

export function FoundingSeatCounter({
  pollInterval = 60_000,
  onClaimClick,
  className = '',
}: FoundingSeatCounterProps) {
  const { status, loading, error } = useFoundingStatus(pollInterval);
  const countdown = useCountdown(status?.deadline);

  const isSoldOut = status !== null && status.remaining === 0;
  const pctClaimed = status ? Math.round((status.claimed / status.total) * 100) : 0;

  if (loading) {
    return (
      <div className={`founding-seat-counter animate-pulse ${className}`} role="status" aria-label="Loading founding seat status">
        <div className="h-4 w-48 rounded bg-white/10" />
        <div className="mt-2 h-2 w-full rounded-full bg-white/10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`founding-seat-counter text-sm text-red-400 ${className}`}>
        Could not load seat availability.
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className={`founding-seat-counter ${className}`}>
      {/* Seat count headline */}
      <div className="flex items-center justify-between gap-4 text-sm font-medium">
        {isSoldOut ? (
          <span className="text-red-400 font-semibold">All {status.total} founding seats claimed</span>
        ) : (
          <span>
            <span className="text-amber-400 font-bold">{status.remaining}</span>
            <span className="text-white/70"> of {status.total} founding seats remaining</span>
          </span>
        )}
        {!isSoldOut && countdown && (
          <span className="text-white/50 tabular-nums text-xs shrink-0">Ends in {countdown}</span>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden"
        role="progressbar"
        aria-valuenow={status.claimed}
        aria-valuemin={0}
        aria-valuemax={status.total}
        aria-label={`${status.claimed} of ${status.total} founding seats claimed`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isSoldOut ? 'bg-red-500' : pctClaimed >= 80 ? 'bg-amber-500' : 'bg-amber-400'
          }`}
          style={{ width: `${pctClaimed}%` }}
        />
      </div>

      {/* CTA */}
      {!isSoldOut && onClaimClick && (
        <button
          onClick={onClaimClick}
          className="mt-4 w-full rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-300 active:scale-95 transition-all"
        >
          Claim Your Founding Seat — $1,997 one-time
        </button>
      )}

      {isSoldOut && (
        <p className="mt-3 text-xs text-white/50">
          Join the waitlist to be notified when monthly plans open.
        </p>
      )}
    </div>
  );
}

export default FoundingSeatCounter;
