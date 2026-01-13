'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  buildCreateCampaignAndDepositInstruction, 
  getCampaignPDA, 
  getVaultPDA 
} from '@/lib/anchor/browser';
import { Avatar } from '@/components/ui/Avatar';

interface Listing {
  id: string;
  slotType: 'HEADER' | 'BIO';
  price24hLamports: string;
  price7dLamports: string;
  price30dLamports: string;
  requiresApproval: boolean;
  description: string | null;
  creatorWallet: string;
  creator: {
    xUsername: string;
    displayName: string | null;
    avatarUrl: string | null;
    verified: boolean;
  } | null;
}

const DURATION_OPTIONS = [
  { label: '24 Hours', value: 86400, priceKey: 'price24hLamports' as const },
  { label: '7 Days', value: 604800, priceKey: 'price7dLamports' as const },
  { label: '30 Days', value: 2592000, priceKey: 'price30dLamports' as const },
];

function formatSol(lamports: string): string {
  return (Number(lamports) / 1_000_000_000).toFixed(2);
}

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[1]); // 7 days default
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<'select' | 'confirm' | 'processing' | 'success'>('select');

  // Fetch listing
  useEffect(() => {
    async function fetchListing() {
  const { id } = await params;
      try {
        const res = await fetch(`/api/listings/${id}`, { credentials: 'include' });
        const data = await res.json();
        
        if (!data.success) {
          setError(data.error || 'Failed to load listing');
          return;
        }
        
        setListing(data.data);
      } catch (err) {
        setError('Failed to load listing');
      } finally {
        setLoading(false);
      }
    }
    
    fetchListing();
  }, [params]);

  const handleBookNow = () => {
    if (!connected) {
      // Wallet button will handle this
      return;
    }
    if (!user) {
      setBookingError('Please sign in first');
      return;
    }
    setShowBookingModal(true);
    setBookingStep('select');
    setBookingError(null);
  };

  const handleConfirmBooking = async () => {
    if (!listing || !publicKey || !user || !sendTransaction) return;
    
    setIsBooking(true);
    setBookingError(null);
    setBookingStep('processing');

    try {
      const amountLamports = listing[selectedDuration.priceKey];
      
      // Step 1: Create campaign in database (get chain campaign ID)
      const campaignRes = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          listingId: listing.id,
          creatorWallet: listing.creatorWallet,
          slotType: listing.slotType,
          durationSeconds: selectedDuration.value,
          amountLamports: amountLamports,
        }),
      });

      const campaignData = await campaignRes.json();
      
      if (!campaignData.success) {
        throw new Error(campaignData.error || 'Failed to create campaign');
      }

      const campaignId = campaignData.data.id;
      const chainCampaignId = BigInt(campaignData.data.chainCampaignId);

      console.log('[Booking] Campaign created in DB:', {
        campaignId,
        chainCampaignId: chainCampaignId.toString(),
        creatorWallet: listing.creatorWallet,
        amount: amountLamports,
        duration: selectedDuration.value,
      });

      // Step 2: Build and send on-chain transaction
      const creatorPubkey = new PublicKey(listing.creatorWallet);
      const amount = BigInt(amountLamports);
      const duration = BigInt(selectedDuration.value);

      // Log the PDAs for debugging
      const [campaignPda] = getCampaignPDA(chainCampaignId);
      const [vaultPda] = getVaultPDA(chainCampaignId);
      console.log('[Booking] PDAs:', {
        campaignPda: campaignPda.toBase58(),
        vaultPda: vaultPda.toBase58(),
      });

      // Build the create_campaign_and_deposit instruction
      const instruction = buildCreateCampaignAndDepositInstruction(
        publicKey,
        chainCampaignId,
        creatorPubkey,
        amount,
        duration
      );

      // Create and send transaction
      const transaction = new Transaction().add(instruction);
      transaction.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      console.log('[Booking] Sending transaction...');

      // Send transaction (wallet will prompt user to sign)
      const txSignature = await sendTransaction(transaction, connection);
      
      console.log('[Booking] Transaction sent:', txSignature);

      // Wait for confirmation
      await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      console.log('[Booking] On-chain transaction confirmed:', txSignature);

      // Step 3: Update campaign status with real tx signature
      const depositRes = await fetch(`/api/campaigns/${campaignId}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          txSignature: txSignature,
        }),
      });

      const depositData = await depositRes.json();
      
      if (!depositData.success) {
        throw new Error(depositData.error || 'Failed to process deposit');
      }

      setBookingStep('success');
      
      // Redirect to campaign page after a short delay
      setTimeout(() => {
        router.push(`/campaigns/${campaignId}`);
      }, 2000);

    } catch (err) {
      console.error('[Booking] Error:', err);
      // Provide more detailed error message
      let errorMessage = 'Booking failed';
      if (err instanceof Error) {
        errorMessage = err.message;
        // Check for common Solana errors
        if (err.message.includes('0x1')) {
          errorMessage = 'Insufficient funds for transaction';
        } else if (err.message.includes('0x0')) {
          errorMessage = 'Transaction simulation failed - check wallet balance';
        } else if (err.message.includes('User rejected')) {
          errorMessage = 'Transaction was rejected by user';
        }
      }
      setBookingError(errorMessage);
      setBookingStep('select');
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-white mb-2">Listing Not Found</h1>
          <p className="text-white/50 mb-6">{error || 'This listing does not exist'}</p>
          <Link href="/listings" className="px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-all">
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  const selectedPrice = listing[selectedDuration.priceKey];

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link 
          href="/listings" 
          className="text-sm text-white/40 hover:text-white transition-colors font-mono"
        >
          ← Back to Listings
        </Link>
        
        {/* Creator header */}
        <div className="flex items-start gap-6 mt-8 mb-8">
          <Avatar 
            src={listing.creator?.avatarUrl}
            alt={listing.creator?.displayName || listing.creator?.xUsername || ''}
            size="xl"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">
                {listing.creator?.displayName || 'Unknown Creator'}
              </h1>
              {listing.creator?.verified && (
                <span className="text-white/60">✓</span>
              )}
            </div>
            <a
              href={`https://x.com/${listing.creator?.xUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/50 hover:text-white transition-colors font-mono"
            >
              @{listing.creator?.xUsername} →
            </a>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-3 mb-8">
          <span className="px-4 py-2 border border-white/30 text-white text-sm font-mono uppercase">
            {listing.slotType}
          </span>
          {!listing.requiresApproval && (
            <span className="px-4 py-2 border border-green-500/50 text-green-400 text-sm font-mono">
              INSTANT
            </span>
          )}
        </div>

        {/* Description */}
        {listing.description && (
          <div className="border border-white/10 p-6 mb-6">
            <h2 className="text-sm text-white/40 font-mono uppercase mb-4">Description</h2>
            <p className="text-white/70 leading-relaxed">
              {listing.description}
            </p>
          </div>
        )}

        {/* Slot info */}
        <div className="border border-white/10 p-6 mb-6">
          <h2 className="text-sm text-white/40 font-mono uppercase mb-4">Slot Type</h2>
          <p className="text-white/50 text-sm">
          {listing.slotType === 'HEADER'
            ? 'Your banner will be displayed as the profile header image (1500x500)'
            : 'Your link/text will be added to the profile bio'}
        </p>
      </div>

      {/* Pricing */}
        <div className="border border-white/10 p-6 mb-6">
          <h2 className="text-sm text-white/40 font-mono uppercase mb-6">Pricing</h2>
        <div className="grid grid-cols-3 gap-4">
            <PricingTile duration="24H" price={formatSol(listing.price24hLamports)} />
            <PricingTile duration="7D" price={formatSol(listing.price7dLamports)} highlight />
            <PricingTile duration="30D" price={formatSol(listing.price30dLamports)} />
        </div>
      </div>

      {/* Book CTA */}
        <div className="border border-white/20 p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-3">
            Ready to Book?
        </h3>
          <p className="text-white/50 text-sm mb-6">
            {!connected 
              ? 'Connect your wallet to create a campaign'
              : !user 
                ? 'Sign in to create a campaign'
                : 'Select duration and confirm your booking'
            }
          </p>
          
          {!connected ? (
            <WalletMultiButton className="!px-8 !py-4 !border-2 !border-white !bg-white !text-black !font-semibold hover:!bg-transparent hover:!text-white !transition-all !rounded-none" />
          ) : !user ? (
            <p className="text-yellow-400 text-sm">Please sign in using the button in the navbar</p>
          ) : (
            <button 
              onClick={handleBookNow}
              className="px-8 py-4 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all"
            >
          Book Now
        </button>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/20 max-w-md w-full p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Book This Slot</h2>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {bookingStep === 'success' ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✓</div>
                <h3 className="text-xl font-bold text-white mb-2">Booking Created!</h3>
                <p className="text-white/50">Redirecting to your campaign...</p>
              </div>
            ) : bookingStep === 'processing' ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Processing...</h3>
                <p className="text-white/50">Creating your campaign</p>
              </div>
            ) : (
              <>
                {/* Error */}
                {bookingError && (
                  <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 text-red-400 text-sm">
                    {bookingError}
                  </div>
                )}

                {/* Creator Info */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                  <Avatar 
                    src={listing.creator?.avatarUrl}
                    alt={listing.creator?.displayName || listing.creator?.xUsername || ''}
                    size="md"
                  />
                  <div>
                    <div className="text-white font-medium">{listing.creator?.displayName || 'Unknown'}</div>
                    <div className="text-white/50 text-sm">@{listing.creator?.xUsername}</div>
                  </div>
                </div>

                {/* Duration Selection */}
                <div className="mb-6">
                  <label className="text-sm text-white/40 font-mono uppercase block mb-3">
                    Select Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DURATION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedDuration(option)}
                        className={`p-3 border text-center transition-all ${
                          selectedDuration.value === option.value
                            ? 'border-white bg-white/10'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <div className="text-white font-medium">{option.label}</div>
                        <div className="text-white/50 text-sm mt-1">
                          {formatSol(listing[option.priceKey])} ◎
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="border border-white/10 p-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-white/50">Slot Type</span>
                    <span className="text-white">{listing.slotType}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-white/50">Duration</span>
                    <span className="text-white">{selectedDuration.label}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="text-white/50">Total</span>
                    <span className="text-white font-bold text-lg">{formatSol(selectedPrice)} ◎</span>
                  </div>
                </div>

                {/* Approval notice */}
                {listing.requiresApproval && (
                  <div className="mb-6 p-3 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm">
                    ⚠️ This listing requires creator approval. Your funds will be held in escrow until approved.
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 px-4 py-3 border border-white/30 text-white/70 hover:border-white hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={isBooking}
                    className="flex-1 px-4 py-3 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all disabled:opacity-50"
                  >
                    {isBooking ? 'Processing...' : 'Confirm Booking'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PricingTile({ 
  duration, 
  price, 
  highlight = false 
}: { 
  duration: string; 
  price: string; 
  highlight?: boolean;
}) {
  return (
    <div className={`
      text-center py-6 px-4 border transition-all
      ${highlight 
        ? 'border-white bg-white/5' 
        : 'border-white/10 hover:border-white/30'
      }
    `}>
      <div className="text-xs text-white/40 font-mono mb-2">{duration}</div>
      <div className="text-2xl font-bold text-white tabular-nums">{price}</div>
      <div className="text-xs text-white/40 mt-1">SOL</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="h-4 w-32 bg-white/10 animate-pulse mb-8" />
        <div className="flex items-start gap-6 mb-8">
          <div className="w-20 h-20 bg-white/10 animate-pulse" />
          <div className="flex-1">
            <div className="h-6 w-48 bg-white/10 animate-pulse mb-2" />
            <div className="h-4 w-32 bg-white/10 animate-pulse" />
          </div>
        </div>
        <div className="h-48 bg-white/5 animate-pulse mb-6" />
        <div className="h-48 bg-white/5 animate-pulse mb-6" />
        <div className="h-32 bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
