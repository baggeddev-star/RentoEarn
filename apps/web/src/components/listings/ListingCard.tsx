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
      followersCount?: number | null;
    } | null;
  };
}

function formatSol(lamports: string): string {
  return (Number(lamports) / 1_000_000_000).toFixed(2);
}

function formatFollowers(count: number | null | undefined): string {
  if (!count) return '0';
  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(1) + 'M';
  }
  if (count >= 1_000) {
    return (count / 1_000).toFixed(1) + 'K';
  }
  return count.toString();
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
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white truncate">
                {listing.creator?.displayName || 'Unknown'}
              </span>
              {listing.creator?.verified && (
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
                </svg>
              )}
            </div>
            <span className="text-sm text-white/50">
              @{listing.creator?.xUsername || 'unknown'}
            </span>
            {/* Follower count */}
            <div className="flex items-center gap-1 mt-1">
              <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs text-white/40">
                {formatFollowers(listing.creator?.followersCount)} followers
              </span>
            </div>
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
