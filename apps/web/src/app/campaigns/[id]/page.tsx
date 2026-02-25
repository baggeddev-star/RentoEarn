'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { StatusChip } from '@/components/ui/StatusChip';
import { CampaignTimeline } from '@/components/campaigns/CampaignTimeline';
import { VerificationLogs } from '@/components/campaigns/VerificationLogs';
import { BILLBOARD_MARKET_ABI, CONTRACT_ADDRESS } from '@/lib/evm/abi';

interface Campaign {
  id: string;
  chainCampaignId: string | null;
  listingId: string | null;
  requestId: string | null;
  sponsorWallet: string;
  creatorWallet: string;
  slotType: 'HEADER' | 'BIO';
  durationSeconds: number;
  amountLamports: string;
  status: string;
  expectedBannerUrl: string | null;
  expectedHash: string | null;
  requiredBioSubstring: string | null;
  createdAt: string;
  startAt: string | null;
  endAt: string | null;
  hardCancelAt: string | null;
  hardCancelReason: string | null;
  depositTxSig: string | null;
  refundTxSig: string | null;
  claimTxSig: string | null;
  listing: {
    creator: {
      xUsername: string;
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
  } | null;
  verificationLogs: {
    id: string;
    checkedAt: string;
    headerOk: boolean;
    hashDistance: number;
    headerUrl: string | null;
    notes: string | null;
  }[];
}

function formatEth(wei: string): string {
  return Number(formatEther(BigInt(wei))).toFixed(4);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortenWallet(wallet: string): string {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export default function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  
  // Banner upload state
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Bio text state
  const [bioText, setBioText] = useState('');

  // Handle writeContract errors
  useEffect(() => {
    if (writeError && pendingAction) {
      console.error('[Campaign] Write contract error:', writeError);
      let errorMessage = 'Transaction failed';
      if (writeError.message.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user';
      } else if (writeError.message.includes('exceeds maximum per-transaction gas limit')) {
        errorMessage = 'Contract call failed - please try again';
      } else if (writeError.message.includes('execution reverted')) {
        errorMessage = 'Contract execution reverted';
      }
      setActionError(errorMessage);
      setActionLoading(null);
      setPendingAction(null);
      resetWrite();
    }
  }, [writeError, pendingAction, resetWrite]);

  // Fetch campaign
  useEffect(() => {
    async function fetchCampaign() {
  const { id } = await params;
      try {
        const res = await fetch(`/api/campaigns/${id}`, { credentials: 'include' });
        const data = await res.json();
        
        if (!data.success) {
          setError(data.error || 'Failed to load campaign');
          return;
        }
        
        setCampaign(data.data);
      } catch (err) {
        setError('Failed to load campaign');
      } finally {
        setLoading(false);
      }
    }
    
    fetchCampaign();
  }, [params]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isSuccess && hash && pendingAction && campaign) {
      handleTxConfirmed(hash, pendingAction);
    }
  }, [isSuccess, hash, pendingAction]);

  const handleTxConfirmed = async (txHash: string, action: string) => {
    if (!campaign) return;
    try {
      await handleAction(action, action, { txHash });
    } finally {
      setPendingAction(null);
      setActionLoading(null);
    }
  };

  const isSponsor = user?.wallet === campaign?.sponsorWallet;
  const isCreator = user?.wallet === campaign?.creatorWallet;

  // Action handlers
  const handleAction = async (action: string, endpoint: string, body?: Record<string, unknown>) => {
    if (!campaign) return;
    
    setActionLoading(action);
    setActionError(null);

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || `Failed to ${action}`);
      }

      // Refresh campaign data
      const refreshRes = await fetch(`/api/campaigns/${campaign.id}`, { credentials: 'include' });
      const refreshData = await refreshRes.json();
      if (refreshData.success) {
        setCampaign(refreshData.data);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  // On-chain action for creator to accept
  const handleApprove = async () => {
    if (!campaign || !address || !campaign.chainCampaignId) return;
    
    setActionLoading('approve');
    setActionError(null);
    setPendingAction('approve');

    try {
      const chainCampaignId = BigInt(campaign.chainCampaignId);
      
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: BILLBOARD_MARKET_ABI,
        functionName: 'creatorAccept',
        args: [chainCampaignId],
        gas: BigInt(200000),
      });
    } catch (err) {
      console.error('[Campaign] Approve error:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to approve');
      setActionLoading(null);
      setPendingAction(null);
    }
  };

  // On-chain action for creator to reject (refunds sponsor)
  const handleReject = async () => {
    if (!campaign || !address || !campaign.chainCampaignId) return;
    
    setActionLoading('reject');
    setActionError(null);
    setPendingAction('reject');

    try {
      const chainCampaignId = BigInt(campaign.chainCampaignId);
      
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: BILLBOARD_MARKET_ABI,
        functionName: 'creatorReject',
        args: [chainCampaignId],
        gas: BigInt(200000),
      });
    } catch (err) {
      console.error('[Campaign] Reject error:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to reject');
      setActionLoading(null);
      setPendingAction(null);
    }
  };

  // On-chain action for creator to claim funds after expiry
  const handleClaim = async () => {
    if (!campaign || !address || !campaign.chainCampaignId) return;
    
    setActionLoading('claim');
    setActionError(null);
    setPendingAction('claim');

    try {
      const chainCampaignId = BigInt(campaign.chainCampaignId);
      
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: BILLBOARD_MARKET_ABI,
        functionName: 'creatorClaim',
        args: [chainCampaignId],
        gas: BigInt(200000),
      });
    } catch (err) {
      console.error('[Campaign] Claim error:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to claim');
      setActionLoading(null);
      setPendingAction(null);
    }
  };

  const handleDeposit = () => handleAction('deposit', 'deposit', { txSignature: 'demo_' + Date.now() });

  // Handle retry verification for stuck campaigns
  const handleRetryVerify = async () => {
    if (!campaign) return;
    
    setActionLoading('retry');
    setActionError(null);

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/retry-verify`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to retry verification');
      }

      // Show success briefly, then let the verification process continue
      setActionError(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to retry verification');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle banner file selection
  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle banner upload
  const handleBannerUpload = async () => {
    if (!campaign || !bannerFile) return;
    
    setUploadingBanner(true);
    setActionError(null);

    try {
      const formData = new FormData();
      formData.append('image', bannerFile);
      formData.append('campaignId', campaign.id);

      const res = await fetch('/api/banner/render', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to upload banner');
      }

      // Refresh campaign data
      const refreshRes = await fetch(`/api/campaigns/${campaign.id}`, { credentials: 'include' });
      const refreshData = await refreshRes.json();
      if (refreshData.success) {
        setCampaign(refreshData.data);
      }
      
      // Clear the file input
      setBannerFile(null);
      setBannerPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to upload banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  // Handle bio text submission
  const handleBioTextSubmit = async () => {
    if (!campaign || !bioText.trim()) return;
    
    setActionLoading('bio');
    setActionError(null);

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/bio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bioText: bioText.trim() }),
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to set bio text');
      }

      // Refresh campaign data
      const refreshRes = await fetch(`/api/campaigns/${campaign.id}`, { credentials: 'include' });
      const refreshData = await refreshRes.json();
      if (refreshData.success) {
        setCampaign(refreshData.data);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to set bio text');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle "I Applied It" button
  const handleApplied = async () => {
    if (!campaign) return;
    
    setActionLoading('applied');
    setActionError(null);

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/applied`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to start verification');
      }

      // Refresh campaign data
      const refreshRes = await fetch(`/api/campaigns/${campaign.id}`, { credentials: 'include' });
      const refreshData = await refreshRes.json();
      if (refreshData.success) {
        setCampaign(refreshData.data);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to start verification');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-white mb-2">Campaign Not Found</h1>
          <p className="text-white/50 mb-6">{error || 'This campaign does not exist'}</p>
          <Link href="/dashboard/sponsor" className="px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-all">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Determine available actions based on status and role
  const canDeposit = isSponsor && campaign.status === 'DRAFT';
  const canApprove = isCreator && campaign.status === 'DEPOSITED';
  const canReject = isCreator && campaign.status === 'DEPOSITED';
  const canClaim = isCreator && campaign.status === 'EXPIRED';
  
  // New action conditions
  const canUploadBanner = isSponsor && campaign.status === 'APPROVAL_PENDING' && campaign.slotType === 'HEADER' && !campaign.expectedBannerUrl;
  const canSetBioText = isSponsor && campaign.status === 'APPROVAL_PENDING' && campaign.slotType === 'BIO' && !campaign.requiredBioSubstring;
  const canMarkApplied = isCreator && campaign.status === 'APPROVAL_PENDING' && (campaign.expectedHash || campaign.requiredBioSubstring);
  const isVerifying = campaign.status === 'VERIFYING';

  return (
    <div className="min-h-screen bg-black pt-24">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <Link 
            href={isSponsor ? '/dashboard/sponsor' : '/dashboard/creator'} 
            className="text-sm text-white/40 hover:text-white transition-colors font-mono"
          >
            ← Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-4 mt-4 mb-4">
          <StatusChip status={campaign.status} />
            <span className="font-mono text-[12px] text-white/40">
              #{campaign.id.slice(0, 8)}
            </span>
            {isSponsor && <span className="text-xs text-blue-400 border border-blue-400/50 px-2 py-0.5">SPONSOR</span>}
            {isCreator && <span className="text-xs text-purple-400 border border-purple-400/50 px-2 py-0.5">CREATOR</span>}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {campaign.slotType === 'HEADER' ? '◧ HEADER' : '≡ BIO'} CAMPAIGN
          </h1>
          <p className="text-white/50 text-sm font-mono">
            Created {formatDate(campaign.createdAt)}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Action Error */}
        {actionError && (
          <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 text-red-400">
            {actionError}
          </div>
        )}

        {/* Action Buttons */}
        {(canDeposit || canApprove || canReject || canClaim || canUploadBanner || canSetBioText || canMarkApplied || isVerifying) && (
          <div className="mb-8 p-6 border border-white/20 bg-white/5">
            <h3 className="text-lg font-bold text-white mb-4">Actions Required</h3>
            
            {canDeposit && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white mb-1">Deposit funds to escrow</p>
                  <p className="text-white/50 text-sm">Amount: {formatEth(campaign.amountLamports)} ETH</p>
                </div>
                <button
                  onClick={handleDeposit}
                  disabled={actionLoading === 'deposit'}
                  className="px-6 py-3 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all disabled:opacity-50"
                >
                  {actionLoading === 'deposit' ? 'Processing...' : 'Deposit Now'}
                </button>
              </div>
            )}

            {canApprove && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white mb-1">Review and approve this campaign</p>
                  <p className="text-white/50 text-sm">Sponsor has deposited {formatEth(campaign.amountLamports)} ETH</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={actionLoading === 'reject'}
                    className="px-6 py-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                  >
                    {actionLoading === 'reject' ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading === 'approve'}
                    className="px-6 py-3 border-2 border-green-500 bg-green-500 text-black font-semibold hover:bg-transparent hover:text-green-400 transition-all disabled:opacity-50"
                  >
                    {actionLoading === 'approve' ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            )}

            {/* Banner Upload for Sponsor */}
            {canUploadBanner && (
              <div className="space-y-4">
                <div>
                  <p className="text-white mb-1">Upload your banner creative</p>
                  <p className="text-white/50 text-sm">Recommended size: 1500×500px (3:1 ratio). Will be resized automatically.</p>
                </div>
                
                <div className="border-2 border-dashed border-white/20 p-6 text-center hover:border-white/40 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerSelect}
                    className="hidden"
                    id="banner-upload"
                  />
                  <label htmlFor="banner-upload" className="cursor-pointer">
                    {bannerPreview ? (
                      <div className="space-y-4">
                        <img 
                          src={bannerPreview} 
                          alt="Preview" 
                          className="max-h-40 mx-auto object-contain border border-white/10"
                        />
                        <p className="text-sm text-white/50">{bannerFile?.name}</p>
                      </div>
                    ) : (
                      <div className="py-8">
                        <div className="text-4xl mb-4">📤</div>
                        <p className="text-white/70">Click to select image</p>
                        <p className="text-white/40 text-sm mt-2">PNG, JPG, or WebP</p>
                      </div>
                    )}
                  </label>
                </div>

                {bannerFile && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setBannerFile(null);
                        setBannerPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="flex-1 px-6 py-3 border border-white/30 text-white/70 hover:text-white hover:border-white/50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBannerUpload}
                      disabled={uploadingBanner}
                      className="flex-1 px-6 py-3 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all disabled:opacity-50"
                    >
                      {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bio Text Input for Sponsor */}
            {canSetBioText && (
              <div className="space-y-4">
                <div>
                  <p className="text-white mb-1">Set required bio text</p>
                  <p className="text-white/50 text-sm">The creator must add this text to their X bio for verification.</p>
                </div>
                
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  placeholder="Enter the text that must appear in creator's bio..."
                  className="w-full px-4 py-3 bg-black border border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none resize-none"
                  rows={3}
                />

                <button
                  onClick={handleBioTextSubmit}
                  disabled={actionLoading === 'bio' || !bioText.trim()}
                  className="w-full px-6 py-3 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all disabled:opacity-50"
                >
                  {actionLoading === 'bio' ? 'Saving...' : 'Set Bio Text'}
                </button>
              </div>
            )}

            {/* "I Applied It" Button for Creator */}
            {canMarkApplied && (
              <div className="space-y-4">
                <div>
                  <p className="text-white mb-1">Ready to start verification?</p>
                  <p className="text-white/50 text-sm">
                    {campaign.slotType === 'HEADER' 
                      ? 'Make sure you\'ve set the banner as your X header image, then click below.'
                      : 'Make sure you\'ve added the required text to your X bio, then click below.'}
                  </p>
                </div>
                
                {campaign.slotType === 'HEADER' && campaign.expectedBannerUrl && (
                  <div className="p-4 bg-white/5 border border-white/10">
                    <p className="text-xs text-white/40 font-mono uppercase mb-3">Banner to apply:</p>
                    <img 
                      src={campaign.expectedBannerUrl} 
                      alt="Banner" 
                      className="w-full aspect-[3/1] object-cover border border-white/10"
                    />
                    <div className="mt-4 space-y-3">
                      <a 
                        href={`/api/banner/download?campaignId=${campaign.id}`}
                        className="block w-full px-4 py-3 text-center border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all"
                      >
                        📥 Download Banner Image
                      </a>
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30">
                        <p className="text-yellow-400 text-sm font-medium mb-2">📋 How to apply:</p>
                        <ol className="text-yellow-200/80 text-xs space-y-1 list-decimal list-inside">
                          <li>Download the banner image above</li>
                          <li>Go to your X profile → Edit profile</li>
                          <li>Click on the header/banner area</li>
                          <li>Upload the downloaded image</li>
                          <li>Save your profile changes</li>
                          <li>Come back here and click "I Applied It"</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
                
                {campaign.slotType === 'BIO' && campaign.requiredBioSubstring && (
                  <div className="p-4 bg-white/5 border border-white/10">
                    <p className="text-xs text-white/40 font-mono uppercase mb-3">Text to add to bio:</p>
                    <div className="p-3 bg-black border border-white/20 font-mono text-white mb-4 select-all">
                      {campaign.requiredBioSubstring}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(campaign.requiredBioSubstring || '');
                        // Optional: show toast
                      }}
                      className="w-full px-4 py-2 text-center border border-white/30 text-white/70 hover:border-white hover:text-white transition-all text-sm"
                    >
                      📋 Copy to Clipboard
                    </button>
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-yellow-400 text-sm font-medium mb-2">📋 How to apply:</p>
                      <ol className="text-yellow-200/80 text-xs space-y-1 list-decimal list-inside">
                        <li>Copy the text above</li>
                        <li>Go to your X profile → Edit profile</li>
                        <li>Add the text to your bio (anywhere)</li>
                        <li>Save your profile changes</li>
                        <li>Come back here and click "I Applied It"</li>
                      </ol>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleApplied}
                  disabled={actionLoading === 'applied'}
                  className="w-full px-6 py-3 border-2 border-green-500 bg-green-500 text-black font-semibold hover:bg-transparent hover:text-green-400 transition-all disabled:opacity-50"
                >
                  {actionLoading === 'applied' ? 'Starting Verification...' : '✓ I Applied It - Start Verification'}
                </button>
              </div>
            )}

            {/* Verifying Status */}
            {isVerifying && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-blue-400 font-medium">Verification in progress...</p>
                </div>
                <p className="text-white/50 text-sm">
                  We're checking your X profile every minute. This may take up to 30 minutes.
                  {campaign.slotType === 'HEADER' 
                    ? ' Make sure the banner is visible as your header image.'
                    : ' Make sure the required text is visible in your bio.'}
                </p>
                
                {/* Retry button */}
                <button
                  onClick={handleRetryVerify}
                  disabled={actionLoading === 'retry'}
                  className="w-full px-4 py-2 border border-white/30 text-white/70 hover:border-white hover:text-white transition-all text-sm"
                >
                  {actionLoading === 'retry' ? 'Re-queuing...' : '🔄 Retry Verification (if stuck)'}
                </button>
              </div>
            )}

            {canClaim && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white mb-1">Campaign completed! Claim your earnings</p>
                  <p className="text-white/50 text-sm">Amount: {formatEth(campaign.amountLamports)} ETH</p>
                </div>
                <button
                  onClick={handleClaim}
                  disabled={actionLoading === 'claim'}
                  className="px-6 py-3 border-2 border-green-500 bg-green-500 text-black font-semibold hover:bg-transparent hover:text-green-400 transition-all disabled:opacity-50"
                >
                  {actionLoading === 'claim' ? 'Processing...' : 'Claim Funds'}
                </button>
              </div>
            )}
          </div>
        )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign details */}
            <div className="border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-6">DETAILS</h3>
              <dl className="grid grid-cols-2 gap-6">
              <div>
                  <dt className="text-sm text-white/40 font-mono uppercase mb-1">SPONSOR</dt>
                  <dd className="font-mono text-sm text-white">
                    {shortenWallet(campaign.sponsorWallet)}
                    {isSponsor && <span className="text-blue-400 ml-2">(You)</span>}
                  </dd>
              </div>
              <div>
                  <dt className="text-sm text-white/40 font-mono uppercase mb-1">CREATOR</dt>
                  <dd className="font-mono text-sm text-white">
                  {campaign.listing?.creator?.displayName || shortenWallet(campaign.creatorWallet)}
                    {isCreator && <span className="text-purple-400 ml-2">(You)</span>}
                </dd>
              </div>
              <div>
                  <dt className="text-sm text-white/40 font-mono uppercase mb-1">AMOUNT</dt>
                  <dd className="font-mono text-sm text-white font-medium tabular-nums">{formatEth(campaign.amountLamports)} ETH</dd>
              </div>
              <div>
                  <dt className="text-sm text-white/40 font-mono uppercase mb-1">DURATION</dt>
                  <dd className="font-mono text-sm text-white">{Math.floor(campaign.durationSeconds / 86400)} days</dd>
              </div>
              {campaign.startAt && (
                <div>
                    <dt className="text-sm text-white/40 font-mono uppercase mb-1">STARTED</dt>
                    <dd className="font-mono text-sm text-white">{formatDate(campaign.startAt)}</dd>
                </div>
              )}
              {campaign.endAt && (
                <div>
                    <dt className="text-sm text-white/40 font-mono uppercase mb-1">ENDS</dt>
                    <dd className="font-mono text-sm text-white">{formatDate(campaign.endAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Banner preview */}
          {campaign.expectedBannerUrl && (
              <div className="border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-6">BANNER</h3>
                <div className="aspect-[3/1] bg-black border border-white/10 overflow-hidden">
                <img
                  src={campaign.expectedBannerUrl}
                  alt="Campaign banner"
                  className="w-full h-full object-cover"
                />
              </div>
              {campaign.expectedHash && (
                  <p className="mt-4 font-mono text-xs text-white/40">
                    PERCEPTUAL HASH: {campaign.expectedHash}
                </p>
              )}
                <div className="mt-4 flex gap-3">
                  <a 
                    href={`/api/banner/download?campaignId=${campaign.id}`}
                    className="flex-1 px-4 py-2 text-center border border-white/30 text-white/70 hover:border-white hover:text-white transition-all text-sm"
                  >
                    📥 Download
                  </a>
                  <a 
                    href={campaign.expectedBannerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 text-center border border-white/30 text-white/70 hover:border-white hover:text-white transition-all text-sm"
                  >
                    🔗 Open in New Tab
                  </a>
                </div>
              </div>
            )}

            {/* Bio substring */}
            {campaign.requiredBioSubstring && (
              <div className="border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4">REQUIRED BIO TEXT</h3>
                <div className="p-4 bg-white/5 border border-white/10 font-mono text-sm text-white">
                  {campaign.requiredBioSubstring}
                </div>
            </div>
          )}

          {/* Verification logs */}
          <VerificationLogs logs={campaign.verificationLogs || []} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <CampaignTimeline campaign={campaign} />

          {/* Transaction links */}
            <div className="border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-6">TRANSACTIONS</h3>
              <div className="space-y-4">
              {campaign.depositTxSig && (
                  <TransactionLink label="DEPOSIT" txSig={campaign.depositTxSig} />
              )}
              {campaign.refundTxSig && (
                  <TransactionLink label="REFUND" txSig={campaign.refundTxSig} />
                )}
                {campaign.claimTxSig && (
                  <TransactionLink label="CLAIM" txSig={campaign.claimTxSig} />
                )}
                {!campaign.depositTxSig && !campaign.refundTxSig && !campaign.claimTxSig && (
                  <p className="font-mono text-sm text-white/40">No transactions yet</p>
                )}
              </div>
            </div>

            {/* Quick links */}
            {campaign.listing && (
              <div className="border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4">RELATED</h3>
                <Link 
                  href={`/listings/${campaign.listingId}`}
                  className="block p-3 border border-white/10 hover:border-white/30 transition-all text-white/70 hover:text-white text-sm"
                >
                  View Original Listing →
                </Link>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionLink({ label, txSig }: { label: string; txSig: string }) {
  const isDemo = txSig.startsWith('demo_');
  
  return (
                <div>
      <span className="text-sm text-white/40 font-mono block mb-1">{label}</span>
      {isDemo ? (
        <span className="font-mono text-sm text-white/50">
          Demo transaction
        </span>
      ) : (
        <a
          href={`https://sepolia.basescan.org/tx/${txSig}`}
                    target="_blank"
                    rel="noopener noreferrer"
          className="font-mono text-sm text-white/70 hover:text-white transition-colors"
                  >
          {txSig.slice(0, 16)}... →
                  </a>
              )}
            </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="h-4 w-40 bg-white/10 animate-pulse mb-4" />
          <div className="h-6 w-32 bg-white/10 animate-pulse mb-4" />
          <div className="h-10 w-64 bg-white/10 animate-pulse" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-white/5 animate-pulse" />
            <div className="h-48 bg-white/5 animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-white/5 animate-pulse" />
            <div className="h-32 bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
