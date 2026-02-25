'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { StatusChip } from '@/components/ui/StatusChip';
import { formatEther, parseEther } from 'viem';

interface Request {
  id: string;
  type: 'SPONSOR_BUY' | 'CREATOR_OFFER';
  title: string;
  description: string;
  slotTypes: ('HEADER' | 'BIO')[];
  durationSeconds: number;
  amountLamports: string;
  status: 'OPEN' | 'CLOSED';
  maxWinners: number | null;
  createdByWallet: string;
  applications: {
    id: string;
    applicantWallet: string;
    message: string | null;
    status: 'APPLIED' | 'ACCEPTED' | 'REJECTED';
    proposedAmountLamports: string | null;
  }[];
}

function formatEth(wei: string): string {
  return Number(formatEther(BigInt(wei))).toFixed(4);
}

function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  if (days >= 30) return `${Math.floor(days / 30)} month`;
  if (days >= 7) return `${Math.floor(days / 7)} week`;
  return `${days} day`;
}

function shortenWallet(wallet: string): string {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { isConnected } = useAccount();
  
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Apply modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  // Check if user already applied
  const [hasApplied, setHasApplied] = useState(false);
  const [userApplication, setUserApplication] = useState<Request['applications'][0] | null>(null);

  // Fetch request
  useEffect(() => {
    async function fetchRequest() {
      const { id } = await params;
      try {
        const res = await fetch(`/api/requests/${id}`, { credentials: 'include' });
        const data = await res.json();
        
        if (!data.success) {
          setError(data.error || 'Failed to load request');
          return;
        }
        
        setRequest(data.data);
        
        // Check if user already applied
        if (user && data.data.applications) {
          const existing = data.data.applications.find(
            (app: Request['applications'][0]) => app.applicantWallet === user.wallet
          );
          if (existing) {
            setHasApplied(true);
            setUserApplication(existing);
          }
        }
      } catch (err) {
        setError('Failed to load request');
      } finally {
        setLoading(false);
      }
    }
    
    fetchRequest();
  }, [params, user]);

  const handleApply = () => {
    if (!isConnected) return;
    if (!user) {
      setApplyError('Please sign in first');
      return;
    }
    setShowApplyModal(true);
    setApplyError(null);
    setApplySuccess(false);
  };

  const handleSubmitApplication = async () => {
    if (!request || !user) return;
    
    setIsApplying(true);
    setApplyError(null);

    try {
      const body: Record<string, unknown> = {};
      
      if (applicationMessage.trim()) {
        body.message = applicationMessage.trim();
      }
      
      if (proposedAmount && parseFloat(proposedAmount) > 0) {
        body.proposedAmountLamports = parseEther(proposedAmount).toString();
      }

      const res = await fetch(`/api/requests/${request.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setApplySuccess(true);
      setHasApplied(true);
      setUserApplication(data.data);
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowApplyModal(false);
        // Refresh the page to show updated applications
        router.refresh();
      }, 2000);

    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Application failed');
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-white mb-2">Request Not Found</h1>
          <p className="text-white/50 mb-6">{error || 'This request does not exist'}</p>
          <Link href="/requests" className="px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-all">
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

  const isSponsorRequest = request.type === 'SPONSOR_BUY';
  const isOwnRequest = user?.wallet === request.createdByWallet;
  const canApply = request.status === 'OPEN' && !isOwnRequest && !hasApplied;

  // For SPONSOR_BUY, creators apply. For CREATOR_OFFER, sponsors apply.
  const needsCreatorProfile = isSponsorRequest && user && !user.isCreator;

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link 
          href="/requests" 
          className="text-sm text-white/40 hover:text-white transition-colors font-mono"
        >
          ← Back to Requests
        </Link>
        
        {/* Header */}
        <div className="mt-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className={`
              px-4 py-2 border text-sm font-mono uppercase
              ${isSponsorRequest 
                ? 'border-blue-500/50 text-blue-400' 
                : 'border-purple-500/50 text-purple-400'
              }
            `}>
              {isSponsorRequest ? 'SPONSOR REQUEST' : 'CREATOR OFFER'}
            </span>
            <StatusChip status={request.status} />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-3">
            {request.title}
          </h1>
          <p className="text-sm text-white/50 font-mono">
            Posted by {shortenWallet(request.createdByWallet)}
            {isOwnRequest && <span className="text-green-400 ml-2">(You)</span>}
          </p>
        </div>

        {/* Description */}
        <div className="border border-white/10 p-6 mb-6">
          <h2 className="text-sm text-white/40 font-mono uppercase mb-4">Description</h2>
          <p className="text-white/70 whitespace-pre-wrap leading-relaxed">
            {request.description}
          </p>
        </div>

        {/* Requirements */}
        <div className="border border-white/10 p-6 mb-6">
          <h2 className="text-sm text-white/40 font-mono uppercase mb-6">Requirements</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-white/40 font-mono uppercase mb-2">Slot Types</div>
              <div className="flex gap-2">
                {request.slotTypes.map((slot: string) => (
                  <span key={slot} className="px-3 py-1 border border-white/20 text-white text-sm font-mono">
                    {slot}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/40 font-mono uppercase mb-2">Duration</div>
              <div className="text-white">
                {formatDuration(request.durationSeconds)}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/40 font-mono uppercase mb-2">Budget</div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {formatEth(request.amountLamports)} ETH
                {request.maxWinners && request.maxWinners > 1 && (
                  <span className="text-white/40 font-normal text-sm"> / slot</span>
                )}
              </div>
            </div>
            {request.maxWinners && (
              <div>
                <div className="text-xs text-white/40 font-mono uppercase mb-2">Available Slots</div>
                <div className="text-white">{request.maxWinners}</div>
              </div>
            )}
          </div>
        </div>

        {/* User's application status */}
        {hasApplied && userApplication && (
          <div className="border border-green-500/30 bg-green-500/10 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-400 font-semibold mb-1">You've Applied!</h3>
                <p className="text-white/50 text-sm">
                  {userApplication.message || 'No message provided'}
                </p>
              </div>
              <StatusChip status={userApplication.status} />
            </div>
          </div>
        )}

        {/* Apply CTA */}
        {request.status === 'OPEN' && !isOwnRequest && (
          <div className="border border-white/20 p-8 text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-3">
              {isSponsorRequest ? 'Interested?' : 'Want to Book?'}
            </h3>
            <p className="text-white/50 text-sm mb-6">
              {!isConnected 
                ? 'Connect your wallet to apply'
                : !user 
                  ? 'Sign in to apply'
                  : hasApplied
                    ? 'You have already applied to this request'
                    : needsCreatorProfile
                      ? 'You need a verified creator profile to apply'
                      : isSponsorRequest
                        ? 'Apply now to be considered for this sponsorship'
                        : 'Connect your wallet to create a campaign'
              }
            </p>
            
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
            ) : hasApplied ? (
              <button 
                disabled
                className="px-8 py-4 border-2 border-white/30 text-white/50 font-semibold cursor-not-allowed"
              >
                Already Applied
              </button>
            ) : needsCreatorProfile ? (
              <Link 
                href="/settings/verify"
                className="inline-block px-8 py-4 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all"
              >
                Verify Your Profile
              </Link>
            ) : (
              <button 
                onClick={handleApply}
                className="px-8 py-4 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all"
              >
                {isSponsorRequest ? 'Apply Now' : 'Book Now'}
              </button>
            )}
          </div>
        )}

        {/* Applications (visible to request owner) */}
        {isOwnRequest && request.applications && request.applications.length > 0 && (
          <div className="border border-white/10 p-6">
            <h2 className="text-sm text-white/40 font-mono uppercase mb-6">
              Applications ({request.applications.length})
            </h2>
            <div className="space-y-2">
              {request.applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex-1">
                    <div className="text-white font-mono text-sm">
                      {shortenWallet(app.applicantWallet)}
                    </div>
                    {app.message && (
                      <p className="text-xs text-white/50 mt-1 line-clamp-2">
                        {app.message}
                      </p>
                    )}
                    {app.proposedAmountLamports && (
                      <p className="text-xs text-green-400 mt-1">
                        Proposed: {formatEth(app.proposedAmountLamports)} ETH
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusChip status={app.status} size="sm" />
                    {app.status === 'APPLIED' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApplicationAction(app.id, 'accept')}
                          className="px-3 py-1 border border-green-500/50 text-green-400 text-xs hover:bg-green-500/10 transition-all"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleApplicationAction(app.id, 'reject')}
                          className="px-3 py-1 border border-red-500/50 text-red-400 text-xs hover:bg-red-500/10 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Public applications list (for non-owners) */}
        {!isOwnRequest && request.applications && request.applications.length > 0 && (
          <div className="border border-white/10 p-6">
            <h2 className="text-sm text-white/40 font-mono uppercase mb-6">
              Applications ({request.applications.length})
            </h2>
            <div className="space-y-2">
              {request.applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 border border-white/10"
                >
                  <div className="text-white font-mono text-sm">
                    {shortenWallet(app.applicantWallet)}
                    {user?.wallet === app.applicantWallet && (
                      <span className="text-green-400 ml-2">(You)</span>
                    )}
                  </div>
                  <StatusChip status={app.status} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/20 max-w-md w-full p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Apply to Request</h2>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {applySuccess ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✓</div>
                <h3 className="text-xl font-bold text-white mb-2">Application Submitted!</h3>
                <p className="text-white/50">The request owner will review your application.</p>
              </div>
            ) : (
              <>
                {/* Error */}
                {applyError && (
                  <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 text-red-400 text-sm">
                    {applyError}
                  </div>
                )}

                {/* Request Summary */}
                <div className="mb-6 pb-6 border-b border-white/10">
                  <h3 className="text-white font-medium mb-2">{request.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <span>{formatEth(request.amountLamports)} ETH</span>
                    <span>•</span>
                    <span>{formatDuration(request.durationSeconds)}</span>
                  </div>
                </div>

                {/* Application Message */}
                <div className="mb-6">
                  <label className="text-sm text-white/40 font-mono uppercase block mb-3">
                    Message (Optional)
                  </label>
                  <textarea
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    placeholder="Introduce yourself and explain why you're a good fit..."
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-3 bg-black border border-white/20 text-white focus:border-white focus:outline-none transition-colors resize-none"
                  />
                  <div className="text-xs text-white/30 mt-1">{applicationMessage.length}/1000</div>
                </div>

                {/* Proposed Amount (for creator offers) */}
                {!isSponsorRequest && (
                  <div className="mb-6">
                    <label className="text-sm text-white/40 font-mono uppercase block mb-3">
                      Your Offer (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={proposedAmount}
                        onChange={(e) => setProposedAmount(e.target.value)}
                        placeholder={formatEth(request.amountLamports)}
                        className="w-full px-4 py-3 bg-black border border-white/20 text-white font-mono focus:border-white focus:outline-none transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">ETH</span>
                    </div>
                    <p className="text-xs text-white/30 mt-1">Leave empty to accept the listed price</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowApplyModal(false)}
                    className="flex-1 px-4 py-3 border border-white/30 text-white/70 hover:border-white hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitApplication}
                    disabled={isApplying}
                    className="flex-1 px-4 py-3 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all disabled:opacity-50"
                  >
                    {isApplying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Helper function for accepting/rejecting applications
  async function handleApplicationAction(applicationId: string, action: 'accept' | 'reject') {
    if (!request) return;
    
    try {
      const res = await fetch(`/api/requests/${request.id}/applications/${applicationId}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (!data.success) {
        alert(data.error || `Failed to ${action} application`);
        return;
      }
      
      // Refresh the page
      router.refresh();
      window.location.reload();
    } catch (err) {
      alert(`Failed to ${action} application`);
    }
  }
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="h-4 w-32 bg-white/10 animate-pulse mb-8" />
        <div className="h-6 w-48 bg-white/10 animate-pulse mb-4" />
        <div className="h-10 w-full bg-white/10 animate-pulse mb-8" />
        <div className="h-48 bg-white/5 animate-pulse mb-6" />
        <div className="h-48 bg-white/5 animate-pulse mb-6" />
        <div className="h-32 bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
