'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { ListingCard } from '@/components/listings/ListingCard';
import Link from 'next/link';

export default function CreatorDashboard() {
  const { user, isLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.wallet) {
      fetchData();
    }
  }, [user?.wallet]);

  async function fetchData() {
    try {
      const [campaignsRes, listingsRes] = await Promise.all([
        fetch(`/api/campaigns?creatorWallet=${user?.wallet}`, { credentials: 'include' }),
        fetch(`/api/listings?creatorWallet=${user?.wallet}`, { credentials: 'include' }),
      ]);

      const campaignsData = await campaignsRes.json();
      const listingsData = await listingsRes.json();

      if (campaignsData.success) {
        setCampaigns(campaignsData.data.campaigns);
      }
      if (listingsData.success) {
        setListings(listingsData.data.listings);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (isLoading || loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <SignInRequired />;
  }

  if (!user.creatorProfile?.verified) {
    return <CreatorRequired />;
  }

  const pendingApproval = campaigns.filter((c) => c.status === 'DEPOSITED');
  const activeCampaigns = campaigns.filter((c) =>
    ['APPROVAL_PENDING', 'VERIFYING', 'LIVE'].includes(c.status)
  );
  const claimable = campaigns.filter((c) => c.status === 'EXPIRED');

  return (
    <div className="min-h-screen bg-black pt-24">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <span className="text-sm text-white/40 uppercase tracking-wider font-mono">Creator Panel</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-2 mb-3">
            Dashboard
          </h1>
          <p className="text-base sm:text-lg text-white/50">
            @{user.creatorProfile?.xUsername} — Manage your listings and campaigns
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8">
            <KPITile value={pendingApproval.length} label="Pending" highlight={pendingApproval.length > 0} />
            <KPITile value={activeCampaigns.length} label="Active" />
            <KPITile value={claimable.length} label="Claimable" highlight={claimable.length > 0} />
            <KPITile value={listings.length} label="Listings" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Pending Approval Alert */}
        {pendingApproval.length > 0 && (
          <section className="mb-12">
            <div className="border border-yellow-500/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <span className="w-2 h-2 bg-yellow-400 animate-pulse" />
                Pending Approval ({pendingApproval.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingApproval.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} viewAs="creator" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Claimable */}
        {claimable.length > 0 && (
          <section className="mb-12">
            <div className="border border-green-500/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <span className="w-2 h-2 bg-green-400" />
                Ready to Claim ({claimable.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {claimable.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} viewAs="creator" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Active Campaigns */}
        {activeCampaigns.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-6">Active Campaigns</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} viewAs="creator" />
              ))}
            </div>
          </section>
        )}

        {/* My Listings */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">My Listings</h2>
            <Link 
              href="/listings/create" 
              className="px-4 py-2 border border-white/30 text-white text-sm hover:border-white hover:bg-white/5 transition-all"
            >
              + New Listing
            </Link>
          </div>
          {listings.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="border border-white/10 p-12 text-center">
              <p className="text-white/50">No listings yet</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function KPITile({ value, label, highlight = false }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div className={`border p-6 text-center transition-all ${
      highlight ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/20 hover:border-white/40'
    }`}>
      <div className={`text-3xl font-bold mb-1 tabular-nums ${highlight ? 'text-yellow-400' : 'text-white'}`}>{value}</div>
      <div className="text-sm text-white/40 font-mono uppercase">{label}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="h-4 w-32 bg-white/10 mb-4 animate-pulse" />
          <div className="h-10 w-64 bg-white/10 mb-3 animate-pulse" />
          <div className="h-5 w-48 bg-white/10 animate-pulse" />
        </div>
      </div>
      
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-white/10 p-6 text-center animate-pulse">
                <div className="h-8 w-12 bg-white/10 mx-auto mb-1" />
                <div className="h-4 w-16 bg-white/10 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="h-6 w-48 bg-white/10 mb-6 animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 border border-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SignInRequired() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 border border-white/20 flex items-center justify-center text-3xl">
          🔐
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
        <p className="text-white/50">
          Please connect your wallet and sign in to view your dashboard.
        </p>
      </div>
    </div>
  );
}

function CreatorRequired() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 border border-white/20 flex items-center justify-center text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Verification Required</h1>
        <p className="text-white/50 mb-8">
          You need to verify your X account to access the creator dashboard.
        </p>
        <Link 
          href="/settings/verify" 
          className="px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-all"
        >
          Verify X Account
        </Link>
      </div>
    </div>
  );
}
