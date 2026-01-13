import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';

interface ListingCardProps {
  listing: {
    id: string;
    slotType: string;
    price24hLamports: string;
    price7dLamports: string;
    price30dLamports: string;
    active: boolean;
    requiresApproval: boolean;
    description?: string | null;
    creator?: {
      xUsername: string;
      displayName: string | null;
      avatarUrl: string | null;
      verified?: boolean;
    } | null;
  };
}

function formatSol(lamports: string): string {
  return (Number(lamports) / 1_000_000_000).toFixed(2);
}

export function ListingCard({ listing }: ListingCardProps) {
  // Use 7d price as the main/default price
  const mainPrice = formatSol(listing.price7dLamports);

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="group border border-white/20 bg-black p-6 hover:border-white/50 hover:bg-white/5 transition-all duration-300 h-full flex flex-col">
        {/* Creator info */}
        <div className="flex items-center gap-4 mb-4">
          <Avatar 
            src={listing.creator?.avatarUrl} 
            alt={listing.creator?.displayName || listing.creator?.xUsername || ''}
            size="lg"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white truncate">
                {listing.creator?.displayName || 'Unknown'}
              </span>
              {listing.creator?.verified && (
                <span className="text-white/60 text-sm">✓</span>
              )}
            </div>
            <span className="text-sm text-white/50">
              @{listing.creator?.xUsername || 'unknown'}
            </span>
          </div>
        </div>

        {/* Badges - Boxy */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 border border-white/30 text-white/80 text-xs font-mono uppercase">
            {listing.slotType}
          </span>
          {!listing.requiresApproval && (
            <span className="px-3 py-1 border border-green-500/50 text-green-400 text-xs font-mono">
              INSTANT
            </span>
          )}
        </div>

        {/* Description */}
        {listing.description && (
          <p className="text-sm text-white/50 mb-4 line-clamp-2 flex-1">
            {listing.description}
          </p>
        )}

        {/* Price - Simple */}
        <div className="pt-4 border-t border-white/10 mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tabular-nums">{mainPrice}</span>
            <span className="text-white/40">◎</span>
          </div>
          <span className="text-xs text-white/40">per week</span>
        </div>
      </div>
    </Link>
  );
}
