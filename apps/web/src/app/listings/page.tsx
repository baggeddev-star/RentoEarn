import { ListingCard } from '@/components/listings/ListingCard';
import Link from 'next/link';

async function getListings(searchParams: { slotType?: string }) {
  const params = new URLSearchParams();
  if (searchParams.slotType) {
    params.set('slotType', searchParams.slotType);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/listings?${params}`, {
    next: { revalidate: 10 }, // Cache for 10 seconds, then revalidate
  });

  if (!res.ok) {
    return { listings: [], pagination: { total: 0 } };
  }

  const data = await res.json();
  return data.data;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ slotType?: string }>;
}) {
  const params = await searchParams;
  const { listings, pagination } = await getListings(params);

  return (
    <div className="min-h-screen bg-black pt-24">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <span className="text-sm text-white/40 uppercase tracking-wider font-mono">Marketplace</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-2 mb-3">
                Listings
              </h1>
              <p className="text-base sm:text-lg text-white/50">
                Browse available header and bio slots
              </p>
            </div>
            <Link 
              href="/listings/create" 
              className="px-6 py-3 border border-white text-white font-medium hover:bg-white hover:text-black transition-all text-center flex-shrink-0"
            >
              + Create Listing
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <FilterChip href="/listings" active={!params.slotType}>
              All
            </FilterChip>
            <FilterChip
              href="/listings?slotType=HEADER"
              active={params.slotType === 'HEADER'}
            >
              Header
            </FilterChip>
            <FilterChip
              href="/listings?slotType=BIO"
              active={params.slotType === 'BIO'}
            >
              Bio
            </FilterChip>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {listings.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing: Record<string, unknown>) => (
                <ListingCard key={listing.id as string} listing={listing as any} />
              ))}
            </div>

            {pagination.total > 0 && (
              <div className="mt-12 text-center">
                <span className="text-sm text-white/40 font-mono">
                  {listings.length} of {pagination.total} listings
                </span>
              </div>
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`
        px-4 py-2 text-sm font-medium transition-all border
        ${active 
          ? 'bg-white text-black border-white' 
          : 'bg-transparent text-white/70 border-white/20 hover:border-white/50 hover:text-white'
        }
      `}
    >
      {children}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 border border-white/10">
      <div className="w-16 h-16 mx-auto mb-6 border border-white/20 flex items-center justify-center text-3xl">
        📋
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No listings found</h3>
      <p className="text-white/50 mb-6">
        Be the first to create a listing!
      </p>
      <Link 
        href="/listings/create" 
        className="inline-block px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-all"
      >
        Create Listing
      </Link>
    </div>
  );
}
