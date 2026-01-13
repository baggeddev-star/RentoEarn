import { RequestCard } from '@/components/requests/RequestCard';
import Link from 'next/link';

async function getRequests(searchParams: { type?: string }) {
  const params = new URLSearchParams();
  if (searchParams.type) {
    params.set('type', searchParams.type);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/requests?${params}`, {
    next: { revalidate: 10 }, // Cache for 10 seconds, then revalidate
  });

  if (!res.ok) {
    return { requests: [], pagination: { total: 0 } };
  }

  const data = await res.json();
  return data.data;
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const { requests, pagination } = await getRequests(params);

  return (
    <div className="min-h-screen bg-black pt-24">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <span className="text-sm text-white/40 uppercase tracking-wider font-mono">Marketplace</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-2 mb-3">
                Requests
              </h1>
              <p className="text-base sm:text-lg text-white/50">
                Sponsor requests and creator offers
              </p>
            </div>
            <Link 
              href="/requests/create" 
              className="px-6 py-3 border border-white text-white font-medium hover:bg-white hover:text-black transition-all text-center flex-shrink-0"
            >
              + Create Request
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <FilterChip href="/requests" active={!params.type}>
              All
            </FilterChip>
            <FilterChip
              href="/requests?type=SPONSOR_BUY"
              active={params.type === 'SPONSOR_BUY'}
            >
              Sponsor Requests
            </FilterChip>
            <FilterChip
              href="/requests?type=CREATOR_OFFER"
              active={params.type === 'CREATOR_OFFER'}
            >
              Creator Offers
            </FilterChip>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {requests.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map((request: Record<string, unknown>) => (
                <RequestCard key={request.id as string} request={request as any} />
              ))}
            </div>

            {pagination.total > 0 && (
              <div className="mt-12 text-center">
                <span className="text-sm text-white/40 font-mono">
                  {requests.length} of {pagination.total} requests
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
      <h3 className="text-xl font-semibold text-white mb-2">No requests found</h3>
      <p className="text-white/50 mb-6">
        Be the first to post a request!
      </p>
      <Link 
        href="/requests/create" 
        className="inline-block px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-all"
      >
        Create Request
      </Link>
    </div>
  );
}
