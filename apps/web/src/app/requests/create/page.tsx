'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';
import Image from 'next/image';
import { parseEther } from 'viem';

const DURATION_OPTIONS = [
  { label: '24 Hours', value: 86400, display: '24h' },
  { label: '3 Days', value: 259200, display: '3d' },
  { label: '7 Days', value: 604800, display: '7d' },
  { label: '14 Days', value: 1209600, display: '14d' },
  { label: '30 Days', value: 2592000, display: '30d' },
];

export default function CreateRequestPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(null);
  const [headerImageFile, setHeaderImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    type: 'SPONSOR_BUY' as 'SPONSOR_BUY' | 'CREATOR_OFFER',
    title: '',
    description: '',
    includeHeader: true,
    includeBio: false,
    durationSeconds: 604800, // 7 days default
    amount: '',
    maxWinners: '1',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setHeaderImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeaderImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeImage = () => {
    setHeaderImageFile(null);
    setHeaderImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.title.trim()) {
        throw new Error('Please enter a title');
      }

      if (!formData.description.trim()) {
        throw new Error('Please enter a description');
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const maxWinners = parseInt(formData.maxWinners);
      if (isNaN(maxWinners) || maxWinners < 1) {
        throw new Error('Max winners must be at least 1');
      }

      // For SPONSOR_BUY, header image is mandatory
      if (formData.type === 'SPONSOR_BUY' && !headerImageFile) {
        throw new Error('Header image is required for sponsor requests');
      }

      // Build slot types array
      const slotTypes: ('HEADER' | 'BIO')[] = [];
      if (formData.includeHeader) slotTypes.push('HEADER');
      if (formData.includeBio) slotTypes.push('BIO');

      if (slotTypes.length === 0) {
        throw new Error('Please select at least Header');
      }

      // Upload header image first if present
      let headerImageUrl: string | null = null;
      if (headerImageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', headerImageFile);
        uploadFormData.append('type', 'request-header');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Failed to upload image');
        }
        headerImageUrl = uploadData.data.url;
      }

      // Convert ETH to wei
      const amountWei = parseEther(formData.amount).toString();

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: formData.type,
          title: formData.title.trim(),
          description: formData.description.trim(),
          slotTypes,
          durationSeconds: formData.durationSeconds,
          amountLamports: amountWei,
          maxWinners: maxWinners > 1 ? maxWinners : undefined,
          headerImageUrl,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create request');
      }

      router.push(`/requests/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return <SignInRequired />;
  }

  const canCreateSponsorRequest = user.creatorProfile?.verified === true;
  const canCreateCreatorOffer = user.creatorProfile?.verified === true;

  if (formData.type === 'SPONSOR_BUY' && !canCreateSponsorRequest) {
    return <VerificationRequired type="sponsor" />;
  }

  if (formData.type === 'CREATOR_OFFER' && !canCreateCreatorOffer) {
    return <VerificationRequired type="creator" />;
  }

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link 
          href="/requests" 
          className="text-sm text-white/40 hover:text-white transition-colors font-mono"
        >
          ← Back to Requests
        </Link>

        <div className="mt-8 mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Create Request
          </h1>
          <p className="text-white/50">
            Post a request for creators or sponsors to respond to
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Request Type */}
          <div>
            <label className="text-sm text-white/40 font-mono uppercase block mb-4">
              Request Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'SPONSOR_BUY', includeHeader: true })}
                disabled={!canCreateSponsorRequest}
                className={`p-6 border text-left transition-all ${
                  formData.type === 'SPONSOR_BUY'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/20 hover:border-white/40'
                } ${!canCreateSponsorRequest ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="font-semibold text-white mb-1">Sponsor Request</div>
                <div className="text-sm text-white/50">Looking to sponsor creators</div>
                {!canCreateSponsorRequest && (
                  <div className="mt-2 text-xs text-yellow-400">Requires verified ✓</div>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'CREATOR_OFFER' })}
                disabled={!canCreateCreatorOffer}
                className={`p-6 border text-left transition-all ${
                  formData.type === 'CREATOR_OFFER'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/20 hover:border-white/40'
                } ${!canCreateCreatorOffer ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-2xl mb-2">🎨</div>
                <div className="font-semibold text-white mb-1">Creator Offer</div>
                <div className="text-sm text-white/50">Offering your profile slots</div>
                {!canCreateCreatorOffer && (
                  <div className="mt-2 text-xs text-yellow-400">Requires creator profile</div>
                )}
              </button>
            </div>
          </div>

          {/* Header Image Upload - Mandatory for SPONSOR_BUY */}
          {formData.type === 'SPONSOR_BUY' && (
            <div>
              <label className="text-sm text-white/40 font-mono uppercase block mb-4">
                Header Image <span className="text-red-400">*</span>
              </label>
              <p className="text-sm text-white/50 mb-4">
                Upload the banner image you want creators to display (1500x500 recommended)
              </p>
              
              {headerImagePreview ? (
                <div className="relative">
                  <div className="aspect-[3/1] relative border border-white/20 overflow-hidden">
                    <Image
                      src={headerImagePreview}
                      alt="Header preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-2 bg-black/80 border border-white/20 text-white hover:bg-red-500/20 hover:border-red-500 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[3/1] border-2 border-dashed border-white/20 hover:border-white/40 cursor-pointer transition-all flex flex-col items-center justify-center"
                >
                  <svg className="w-12 h-12 text-white/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-white/50">Click to upload header image</span>
                  <span className="text-xs text-white/30 mt-1">PNG, JPG up to 5MB</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-sm text-white/40 font-mono uppercase block mb-4">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={formData.type === 'SPONSOR_BUY' 
                ? "e.g., Looking for crypto influencers for NFT launch"
                : "e.g., Premium header slot available - 50K followers"
              }
              maxLength={200}
              className="w-full px-4 py-3 bg-black border border-white/20 text-white focus:border-white focus:outline-none transition-colors"
              required
            />
            <div className="text-xs text-white/30 mt-2">{formData.title.length}/200</div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-white/40 font-mono uppercase block mb-4">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={formData.type === 'SPONSOR_BUY'
                ? "Describe what you're looking for: niche, follower count, engagement requirements..."
                : "Describe your profile: audience demographics, engagement rate, past sponsors..."
              }
              rows={5}
              maxLength={2000}
              className="w-full px-4 py-3 bg-black border border-white/20 text-white focus:border-white focus:outline-none transition-colors resize-none"
              required
            />
            <div className="text-xs text-white/30 mt-2">{formData.description.length}/2000</div>
          </div>

          {/* Slot Types - Header is always included for SPONSOR_BUY, Bio is optional */}
          <div>
            <label className="text-sm text-white/40 font-mono uppercase block mb-4">
              Slot Types
            </label>
            <div className="flex gap-4">
              <div
                className={`flex-1 p-4 border text-center ${
                  formData.type === 'SPONSOR_BUY' 
                    ? 'border-white bg-white/10 cursor-not-allowed' 
                    : formData.includeHeader 
                      ? 'border-white bg-white/10 cursor-pointer' 
                      : 'border-white/20 hover:border-white/40 cursor-pointer'
                }`}
                onClick={() => {
                  if (formData.type !== 'SPONSOR_BUY') {
                    setFormData({ ...formData, includeHeader: !formData.includeHeader });
                  }
                }}
              >
                <span className="text-xl">🖼️</span>
                <div className="text-white mt-1">Header</div>
                {formData.type === 'SPONSOR_BUY' && (
                  <div className="text-xs text-white/50 mt-1">Required</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, includeBio: !formData.includeBio })}
                className={`flex-1 p-4 border text-center transition-all ${
                  formData.includeBio
                    ? 'border-white bg-white/10'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <span className="text-xl">📝</span>
                <div className="text-white mt-1">Bio</div>
                <div className="text-xs text-white/50 mt-1">Optional</div>
              </button>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-sm text-white/40 font-mono uppercase block mb-4">
              Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, durationSeconds: option.value })}
                  className={`px-4 py-2 border transition-all ${
                    formData.durationSeconds === option.value
                      ? 'border-white bg-white text-black'
                      : 'border-white/20 text-white hover:border-white/40'
                  }`}
                >
                  {option.display}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/40 font-mono uppercase block mb-4">
                {formData.type === 'SPONSOR_BUY' ? 'Budget per Slot' : 'Price per Slot'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-black border border-white/20 text-white font-mono focus:border-white focus:outline-none transition-colors"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">ETH</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-white/40 font-mono uppercase block mb-4">
                Max Slots
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.maxWinners}
                onChange={(e) => setFormData({ ...formData, maxWinners: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-white/20 text-white font-mono focus:border-white focus:outline-none transition-colors"
              />
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Request'}
            </button>
            <Link
              href="/requests"
              className="px-8 py-4 border border-white/30 text-white/70 hover:border-white hover:text-white transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
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

function SignInRequired() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 mx-auto mb-6 border border-white/20 flex items-center justify-center text-3xl">
          🔐
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
        <p className="text-white/50 mb-8">
          Connect your wallet and sign in to create a request.
        </p>
        <Link 
          href="/requests" 
          className="inline-block px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-all"
        >
          Back to Requests
        </Link>
      </div>
    </div>
  );
}

function VerificationRequired({ type }: { type: 'sponsor' | 'creator' }) {
  const isSponsor = type === 'sponsor';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 mx-auto mb-6 border border-white/20 flex items-center justify-center text-3xl">
          {isSponsor ? '✓' : '🎨'}
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">
          {isSponsor ? 'Twitter Verification Required' : 'Creator Profile Required'}
        </h1>
        <p className="text-white/50 mb-8">
          {isSponsor 
            ? 'To create sponsor requests, you need a verified Twitter account (blue checkmark). This helps creators trust that you are a legitimate sponsor.'
            : 'To create creator offers, you need to verify your X account first.'
          }
        </p>
        <div className="space-y-4">
          <Link 
            href="/settings/verify" 
            className="block px-6 py-3 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all"
          >
            {isSponsor ? 'Connect Twitter' : 'Verify X Account'}
          </Link>
          <Link 
            href="/requests" 
            className="block px-6 py-3 border border-white/30 text-white/70 hover:border-white hover:text-white transition-all"
          >
            Back to Requests
          </Link>
        </div>
      </div>
    </div>
  );
}
