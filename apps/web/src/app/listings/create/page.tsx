'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';

const WEI_PER_ETH = 1_000_000_000_000_000_000n;

export default function CreateListingPage() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [formData, setFormData] = useState({
    slotType: 'HEADER' as 'HEADER' | 'BIO',
    price24h: '',
    price7d: '',
    price30d: '',
    requiresApproval: true,
    description: '',
  });

  useEffect(() => {
    refreshUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const price24h = parseFloat(formData.price24h);
      const price7d = parseFloat(formData.price7d);
      const price30d = parseFloat(formData.price30d);

      if (isNaN(price24h) || isNaN(price7d) || isNaN(price30d)) {
        throw new Error('Please enter valid prices');
      }

      if (price24h <= 0 || price7d <= 0 || price30d <= 0) {
        throw new Error('Prices must be greater than 0');
      }

      const price24hWei = (BigInt(Math.floor(price24h * 1e18))).toString();
      const price7dWei = (BigInt(Math.floor(price7d * 1e18))).toString();
      const price30dWei = (BigInt(Math.floor(price30d * 1e18))).toString();

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          slotType: formData.slotType,
          price24hLamports: price24hWei,
          price7dLamports: price7dWei,
          price30dLamports: price30dWei,
          requiresApproval: formData.requiresApproval,
          description: formData.description || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        if (res.status === 401) {
          setSessionExpired(true);
          await refreshUser();
        }
        throw new Error(data.error || 'Failed to create listing');
      }

      router.push(`/listings/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (sessionExpired) {
    return <SessionExpired />;
  }

  if (!user) {
    return <SignInRequired />;
  }

  if (!user.creatorProfile?.verified) {
    return <CreatorRequired />;
  }

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link 
          href="/listings" 
          className="text-sm text-white/40 hover:text-white transition-colors font-mono"
        >
          ← Back to Listings
        </Link>

        {/* Header */}
        <div className="mt-8 mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Create Listing
          </h1>
          <p className="text-white/50">
            List your X profile slot for sponsors to book
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Slot Type */}
          <div>
            <label className="text-sm text-white/40 font-mono uppercase block mb-4">
              Slot Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, slotType: 'HEADER' })}
                className={`p-6 border text-left transition-all ${
                  formData.slotType === 'HEADER'
                    ? 'border-white bg-white/10'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="text-2xl mb-2">🖼️</div>
                <div className="font-semibold text-white mb-1">Header</div>
                <div className="text-sm text-white/50">Profile banner image (1500x500)</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, slotType: 'BIO' })}
                className={`p-6 border text-left transition-all ${
                  formData.slotType === 'BIO'
                    ? 'border-white bg-white/10'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="text-2xl mb-2">📝</div>
                <div className="font-semibold text-white mb-1">Bio</div>
                <div className="text-sm text-white/50">Link or text in profile bio</div>
              </button>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <label className="text-sm text-white/40 font-mono uppercase block mb-4">
              Pricing (ETH)
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-white/40 block mb-2">24 Hours</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.price24h}
                    onChange={(e) => setFormData({ ...formData, price24h: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-black border border-white/20 text-white font-mono focus:border-white focus:outline-none transition-colors"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">ETH</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-2">7 Days</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.price7d}
                    onChange={(e) => setFormData({ ...formData, price7d: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-black border border-white/20 text-white font-mono focus:border-white focus:outline-none transition-colors"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">ETH</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-2">30 Days</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.price30d}
                    onChange={(e) => setFormData({ ...formData, price30d: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-black border border-white/20 text-white font-mono focus:border-white focus:outline-none transition-colors"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">ETH</span>
                </div>
              </div>
            </div>
          </div>

          {/* Approval */}
          <div>
            <label className="text-sm text-white/40 font-mono uppercase block mb-4">
              Approval Mode
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, requiresApproval: true })}
                className={`p-4 border text-left transition-all ${
                  formData.requiresApproval
                    ? 'border-white bg-white/10'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="font-semibold text-white mb-1">Manual Approval</div>
                <div className="text-sm text-white/50">Review each booking request</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, requiresApproval: false })}
                className={`p-4 border text-left transition-all ${
                  !formData.requiresApproval
                    ? 'border-white bg-white/10'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="font-semibold text-white mb-1 flex items-center gap-2">
                  Instant <span className="text-green-400 text-xs">⚡</span>
                </div>
                <div className="text-sm text-white/50">Auto-approve all bookings</div>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-white/40 font-mono uppercase block mb-4">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell sponsors about your audience, engagement, niche..."
              rows={4}
              className="w-full px-4 py-3 bg-black border border-white/20 text-white focus:border-white focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-8 py-4 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Listing'}
            </button>
            <Link
              href="/listings"
              className="px-8 py-4 border border-white/30 text-white/70 hover:border-white hover:text-white transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Info */}
        <div className="mt-12 p-6 border border-white/10">
          <h3 className="font-semibold text-white mb-3">How it works</h3>
          <ul className="space-y-2 text-sm text-white/50">
            <li>• Your listing will be visible to all sponsors</li>
            <li>• Sponsors deposit ETH into escrow when booking</li>
            <li>• You apply the banner/bio change to your profile</li>
            <li>• Our system verifies the change automatically</li>
            <li>• You claim your earnings after the campaign ends</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="h-4 w-32 bg-white/10 animate-pulse mb-8" />
        <div className="h-10 w-48 bg-white/10 animate-pulse mb-4" />
        <div className="h-5 w-64 bg-white/10 animate-pulse mb-12" />
        <div className="space-y-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionExpired() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 mx-auto mb-6 border border-yellow-500/50 bg-yellow-500/10 flex items-center justify-center text-3xl">
          ⏰
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Session Expired</h1>
        <p className="text-white/50 mb-8">
          Your session has expired. Please sign in again by clicking the &quot;Sign In&quot; button in the header.
        </p>
        <Link 
          href="/listings" 
          className="inline-block px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-all"
        >
          Back to Listings
        </Link>
      </div>
    </div>
  );
}

function SignInRequired() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 mx-auto mb-6 border border-white/20 flex items-center justify-center text-3xl">
          🔐
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
        <p className="text-white/50 mb-8">
          Connect your wallet and sign in to create a listing.
        </p>
        <Link 
          href="/listings" 
          className="inline-block px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-all"
        >
          Back to Listings
        </Link>
      </div>
    </div>
  );
}

function CreatorRequired() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 mx-auto mb-6 border border-white/20 flex items-center justify-center text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Verification Required</h1>
        <p className="text-white/50 mb-8">
          You need to verify your X account to create listings. This helps sponsors trust that you own the profile.
        </p>
        <div className="space-y-4">
          <Link 
            href="/settings/verify" 
            className="block px-6 py-3 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all"
          >
            Verify X Account
          </Link>
          <Link 
            href="/listings" 
            className="block px-6 py-3 border border-white/30 text-white/70 hover:border-white hover:text-white transition-all"
          >
            Back to Listings
          </Link>
        </div>
      </div>
    </div>
  );
}
