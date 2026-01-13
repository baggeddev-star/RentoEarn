'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import Link from 'next/link';

export default function SponsorDashboard() {
  const { user, isLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.wallet) {
      fetchCampaigns();
    }
  }, [user?.wallet]);

  async function fetchCampaigns() {
    try {
      const res = await fetch(`/api/campaigns?sponsorWallet=${user?.wallet}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data.campaigns);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
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

  // Draft campaigns need action
  const draftCampaigns = campaigns.filter((c) => c.status === 'DRAFT');
  
  const activeCampaigns = campaigns.filter((c) =>
    ['DEPOSITED', 'APPROVAL_PENDING', 'VERIFYING', 'LIVE'].includes(c.status)
  );
  const completedCampaigns = campaigns.filter((c) =>
    ['EXPIRED', 'CLAIMED'].includes(c.status)
  );
  const canceledCampaigns = campaigns.filter((c) =>
    ['CANCELED_SOFT', 'CANCELED_HARD', 'FAILED_VERIFICATION', 'REFUNDED'].includes(c.status)
  );

  return (
    <div className="min-h-screen bg-black pt-24">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <span className="text-sm text-white/40 uppercase tracking-wider font-mono">Sponsor Panel</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-2 mb-3">
                My Bookings
              </h1>
              <p className="text-base sm:text-lg text-white/50">
                Manage your sponsored campaigns
              </p>
            </div>
            <Link 
              href="/listings" 
              className="px-6 py-3 border border-white text-white font-medium hover:bg-white hover:text-black transition-all text-center flex-shrink-0"
            >
              Book New Slot
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-4 py-8">
            <KPITile value={draftCampaigns.length} label="Pending" highlight={draftCampaigns.length > 0} />
            <KPITile value={activeCampaigns.length} label="Active" />
            <KPITile value={completedCampaigns.length} label="Completed" />
            <KPITile value={canceledCampaigns.length} label="Canceled" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Draft Campaigns - Need Action */}
        {draftCampaigns.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-2">⚡ Action Required</h2>
            <p className="text-white/50 text-sm mb-6">These campaigns need your deposit to proceed</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} viewAs="sponsor" />
              ))}
            </div>
          </section>
        )}

        {/* Active Campaigns */}
        {activeCampaigns.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-6">Active Campaigns</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} viewAs="sponsor" />
              ))}
            </div>
          </section>
        )}

        {/* Completed */}
        {completedCampaigns.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-6">Completed</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} viewAs="sponsor" />
              ))}
            </div>
          </section>
        )}

        {/* Canceled */}
        {canceledCampaigns.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-6">Canceled</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {canceledCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} viewAs="sponsor" />
              ))}
            </div>
          </section>
        )}

        {campaigns.length === 0 && !loading && (
          <div className="text-center py-20 border border-white/10">
            <div className="w-16 h-16 mx-auto mb-6 border border-white/20 flex items-center justify-center text-3xl">
              📊
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No campaigns yet</h3>
            <p className="text-white/50 mb-6">
              Start by booking a creator&apos;s slot
            </p>
            <Link 
              href="/listings" 
              className="inline-block px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-all"
            >
              Browse Listings
            </Link>
          </div>
        )}
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
          <div className="grid grid-cols-3 gap-4 py-8">
            {[1, 2, 3].map((i) => (
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
          Please connect your wallet and sign in to view your bookings.
        </p>
      </div>
    </div>
  );
}
