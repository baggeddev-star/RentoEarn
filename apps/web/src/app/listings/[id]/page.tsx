'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther, isAddress } from 'viem';
import { BILLBOARD_MARKET_ABI, CONTRACT_ADDRESS } from '@/lib/evm/abi';
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

function formatEth(wei: string): string {
  const eth = Number(formatEther(BigInt(wei)));
  if (eth < 0.0001) return eth.toExponential(2);
  if (eth < 0.01) return eth.toFixed(6);
  if (eth < 1) return eth.toFixed(4);
  return eth.toFixed(2);
}

function formatUsd(wei: string, ethPrice: number): string {
  const eth = Number(formatEther(BigInt(wei)));
  const usd = eth * ethPrice;
  if (usd < 0.01) return '<$0.01';
  if (usd < 1) return `$${usd.toFixed(2)}`;
  if (usd < 1000) return `$${usd.toFixed(2)}`;
  return `$${usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[1]);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<'select' | 'confirm' | 'processing' | 'success'>('select');
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [ethPrice, setEthPrice] = useState<number>(2800);

  // Handle writeContract errors
  useEffect(() => {
    if (writeError && bookingStep === 'processing') {
      console.error('[Booking] Write contract error:', writeError);
      let errorMessage = 'Transaction failed';
      if (writeError.message.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user';
      } else if (writeError.message.includes('exceeds maximum per-transaction gas limit')) {
        errorMessage = 'Contract call failed - the contract may not be deployed or the parameters are invalid';
      } else if (writeError.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (writeError.message.includes('execution reverted')) {
        errorMessage = 'Contract execution reverted - check if campaign already exists';
      }
      setBookingError(errorMessage);
      setBookingStep('select');
      resetWrite();
    }
  }, [writeError, bookingStep, resetWrite]);

  useEffect(() => {
    async function fetchEthPrice() {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );
        if (res.ok) {
          const data = await res.json();
          if (data.ethereum?.usd) {
            setEthPrice(data.ethereum.usd);
          }
        }
      } catch {
        // Keep default price
      }
    }
    fetchEthPrice();
  }, []);

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

  useEffect(() => {
    if (isSuccess && hash && campaignId) {
      handleDepositConfirmed(hash);
    }
  }, [isSuccess, hash, campaignId]);

  const handleDepositConfirmed = async (txHash: string) => {
    if (!campaignId) return;
    
    try {
      const depositRes = await fetch(`/api/campaigns/${campaignId}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ txHash }),
      });

      const depositData = await depositRes.json();
      
      if (!depositData.success) {
        throw new Error(depositData.error || 'Failed to process deposit');
      }

      setBookingStep('success');
      
      setTimeout(() => {
        router.push(`/campaigns/${campaignId}`);
      }, 2000);
    } catch (err) {
      console.error('[Booking] Deposit confirmation error:', err);
      setBookingError(err instanceof Error ? err.message : 'Failed to confirm deposit');
      setBookingStep('select');
    }
  };

  const handleBookNow = () => {
    if (!isConnected) return;
    if (!user) {
      setBookingError('Please sign in first');
      return;
    }
    setShowBookingModal(true);
    setBookingStep('select');
    setBookingError(null);
  };

  const handleConfirmBooking = async () => {
    if (!listing || !address || !user) return;
    
    setBookingError(null);
    setBookingStep('processing');

    try {
      // Validate creator wallet is a valid EVM address
      if (!isAddress(listing.creatorWallet)) {
        throw new Error('Creator wallet is not a valid EVM address. The creator needs to re-register with an EVM wallet.');
      }

      const amountWei = listing[selectedDuration.priceKey];
      
      const campaignRes = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          listingId: listing.id,
          creatorWallet: listing.creatorWallet,
          slotType: listing.slotType,
          durationSeconds: selectedDuration.value,
          amountLamports: amountWei,
        }),
      });

      const campaignData = await campaignRes.json();
      
      if (!campaignData.success) {
        throw new Error(campaignData.error || 'Failed to create campaign');
      }

      const newCampaignId = campaignData.data.id;
      const chainCampaignId = BigInt(campaignData.data.chainCampaignId);
      setCampaignId(newCampaignId);

      console.log('[Booking] Campaign created in DB:', {
        campaignId: newCampaignId,
        chainCampaignId: chainCampaignId.toString(),
        creatorWallet: listing.creatorWallet,
        amount: amountWei,
        duration: selectedDuration.value,
      });

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: BILLBOARD_MARKET_ABI,
        functionName: 'createCampaignAndDeposit',
        args: [chainCampaignId, listing.creatorWallet as `0x${string}`, BigInt(selectedDuration.value)],
        value: BigInt(amountWei),
        gas: BigInt(500000),
      });

    } catch (err) {
      console.error('[Booking] Error:', err);
      let errorMessage = 'Booking failed';
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.message.includes('User rejected')) {
          errorMessage = 'Transaction was rejected by user';
        } else if (err.message.includes('exceeds maximum per-transaction gas limit')) {
          errorMessage = 'Transaction failed - please check that the contract is deployed and try again';
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction';
        }
      }
      setBookingError(errorMessage);
      setBookingStep('select');
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
        <Link 
          href="/listings" 
          className="text-sm text-white/40 hover:text-white transition-colors font-mono"
        >
          ← Back to Listings
        </Link>
        
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

        {listing.description && (
          <div className="border border-white/10 p-6 mb-6">
            <h2 className="text-sm text-white/40 font-mono uppercase mb-4">Description</h2>
            <p className="text-white/70 leading-relaxed">
              {listing.description}
            </p>
          </div>
        )}

        <div className="border border-white/10 p-6 mb-6">
          <h2 className="text-sm text-white/40 font-mono uppercase mb-4">Slot Type</h2>
          <p className="text-white/50 text-sm">
            {listing.slotType === 'HEADER'
              ? 'Your banner will be displayed as the profile header image (1500x500)'
              : 'Your link/text will be added to the profile bio'}
          </p>
        </div>

        <div className="border border-white/10 p-6 mb-6">
          <h2 className="text-sm text-white/40 font-mono uppercase mb-6">Pricing</h2>
          <div className="grid grid-cols-3 gap-4">
            <PricingTile duration="24H" price={formatEth(listing.price24hLamports)} usd={formatUsd(listing.price24hLamports, ethPrice)} />
            <PricingTile duration="7D" price={formatEth(listing.price7dLamports)} usd={formatUsd(listing.price7dLamports, ethPrice)} highlight />
            <PricingTile duration="30D" price={formatEth(listing.price30dLamports)} usd={formatUsd(listing.price30dLamports, ethPrice)} />
          </div>
        </div>

        <div className="border border-white/20 p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-3">
            Ready to Book?
          </h3>
          
          {!isAddress(listing.creatorWallet) ? (
            <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 text-sm mb-4">
              This listing cannot be booked because the creator has not migrated to an EVM wallet.
              The creator needs to re-register with a Base-compatible wallet.
            </div>
          ) : (
            <p className="text-white/50 text-sm mb-6">
              {!isConnected 
                ? 'Connect your wallet to create a campaign'
                : !user 
                  ? 'Sign in to create a campaign'
                  : 'Select duration and confirm your booking'
              }
            </p>
          )}
          
          {!isConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="px-8 py-4 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all"
                >
                  Connect Wallet
                </button>
              )}
            </ConnectButton.Custom>
          ) : !user ? (
            <p className="text-yellow-400 text-sm">Please sign in using the button in the navbar</p>
          ) : !isAddress(listing.creatorWallet) ? (
            <button 
              disabled
              className="px-8 py-4 border-2 border-white/30 bg-white/10 text-white/50 font-semibold cursor-not-allowed"
            >
              Booking Unavailable
            </button>
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

      {showBookingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/20 max-w-md w-full p-6">
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
            ) : bookingStep === 'processing' || isPending || isConfirming ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Confirming...' : 'Processing...'}
                </h3>
                <p className="text-white/50">
                  {isPending ? 'Please confirm the transaction in your wallet' : 'Creating your campaign'}
                </p>
              </div>
            ) : (
              <>
                {bookingError && (
                  <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 text-red-400 text-sm">
                    {bookingError}
                  </div>
                )}

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
                          {formatEth(listing[option.priceKey])} ETH
                        </div>
                        <div className="text-white/30 text-xs">
                          ({formatUsd(listing[option.priceKey], ethPrice)})
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

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
                    <div className="text-right">
                      <span className="text-white font-bold text-lg">{formatEth(selectedPrice)} ETH</span>
                      <span className="text-white/40 text-sm ml-2">({formatUsd(selectedPrice, ethPrice)})</span>
                    </div>
                  </div>
                </div>

                {listing.requiresApproval && (
                  <div className="mb-6 p-3 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm">
                    ⚠️ This listing requires creator approval. Your funds will be held in escrow until approved.
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 px-4 py-3 border border-white/30 text-white/70 hover:border-white hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={isPending || isConfirming}
                    className="flex-1 px-4 py-3 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all disabled:opacity-50"
                  >
                    Confirm Booking
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
  usd,
  highlight = false 
}: { 
  duration: string; 
  price: string;
  usd: string;
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
      <div className="text-xs text-white/40 mt-1">ETH</div>
      <div className="text-xs text-white/30 mt-1">({usd})</div>
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
