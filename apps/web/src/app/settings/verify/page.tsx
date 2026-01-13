'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';

export default function VerifyPage() {
  const router = useRouter();
  const { user, isLoading: walletLoading, refreshUser } = useAuth();
  const { data: twitterSession, status: twitterStatus } = useSession();
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Determine states
  const isLoading = walletLoading || twitterStatus === 'loading';
  const walletConnected = !!user;
  const twitterConnected = !!twitterSession?.twitterUsername;

  // Auto-link when both are connected
  useEffect(() => {
    if (walletConnected && twitterConnected && !user?.creatorProfile?.verified && !isLinking && !success) {
      handleLinkAccounts();
    }
  }, [walletConnected, twitterConnected, user?.creatorProfile?.verified]);

  const handleLinkAccounts = async () => {
    if (isLinking) return;
    
    setIsLinking(true);
    setError(null);

    try {
      const res = await fetch('/api/x/link-twitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to link accounts');
      }

      setSuccess('Your X account has been verified!');
      await refreshUser();
      
      // Sign out of Twitter session (we don't need it anymore)
      await signOut({ redirect: false });
      
      setTimeout(() => router.push('/dashboard/creator'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLinking(false);
    }
  };

  const handleTwitterSignIn = () => {
    signIn('twitter', { callbackUrl: '/settings/verify' });
  };

  const handleTwitterSignOut = async () => {
    await signOut({ redirect: false });
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  // Not signed in with wallet
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-6 border border-white/20 flex items-center justify-center text-3xl">
            🔐
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-white/50 mb-8">
            Connect your wallet and sign in to verify your X account.
          </p>
          <Link 
            href="/" 
            className="inline-block px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-all"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Already verified
  if (user.creatorProfile?.verified) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="max-w-lg mx-auto px-6 py-12">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 border-2 border-green-500 flex items-center justify-center text-4xl">
              ✓
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Already Verified</h1>
            <p className="text-white/50 mb-2">
              Your X account <span className="text-white">@{user.creatorProfile.xUsername}</span> is verified.
            </p>
            {user.creatorProfile.displayName && (
              <p className="text-white/70 mb-8">{user.creatorProfile.displayName}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/dashboard/creator" 
                className="px-6 py-3 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all"
              >
                Go to Dashboard
              </Link>
              <Link 
                href="/listings/create" 
                className="px-6 py-3 border border-white/30 text-white/70 hover:border-white hover:text-white transition-all"
              >
                Create Listing
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Header */}
        <Link 
          href="/" 
          className="text-sm text-white/40 hover:text-white transition-colors font-mono"
        >
          ← Back
        </Link>

        <div className="mt-8 mb-12 text-center">
          <div className="w-16 h-16 mx-auto mb-6 border border-white/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Verify Your X Account
          </h1>
          <p className="text-white/50">
            Sign in with Twitter to verify your account ownership
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-8 p-4 border border-green-500/50 bg-green-500/10 text-green-400 text-center">
            {success}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 border border-red-500/50 bg-red-500/10 text-red-400">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-300 hover:text-red-100"
            >
              ×
            </button>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-6">
          {/* Step 1: Wallet Connection */}
          <div className={`border p-6 ${walletConnected ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${walletConnected ? 'bg-green-500 text-black' : 'bg-white/10 text-white/50'}`}>
                {walletConnected ? '✓' : '1'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Connect Wallet</h3>
                <p className="text-sm text-white/50">
                  {walletConnected 
                    ? `Connected: ${user.wallet.slice(0, 4)}...${user.wallet.slice(-4)}`
                    : 'Connect your Solana wallet'}
                </p>
              </div>
            </div>
            {!walletConnected && (
              <p className="text-sm text-white/40">
                Click the "Connect Wallet" button in the header to get started.
              </p>
            )}
          </div>

          {/* Step 2: Twitter Sign In */}
          <div className={`border p-6 ${twitterConnected ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${twitterConnected ? 'bg-green-500 text-black' : 'bg-white/10 text-white/50'}`}>
                {twitterConnected ? '✓' : '2'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Sign in with X</h3>
                <p className="text-sm text-white/50">
                  {twitterConnected 
                    ? `Signed in as @${twitterSession.twitterUsername}`
                    : 'Verify your X account ownership'}
                </p>
              </div>
            </div>
            
            {!twitterConnected ? (
              <button
                onClick={handleTwitterSignIn}
                disabled={!walletConnected}
                className="w-full px-6 py-4 bg-[#1DA1F2] text-white font-semibold hover:bg-[#1a8cd8] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Sign in with X (Twitter)
              </button>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {twitterSession.twitterImage && (
                    <img 
                      src={twitterSession.twitterImage.replace('_normal', '_400x400')} 
                      alt={twitterSession.twitterName || ''} 
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-white font-medium">{twitterSession.twitterName}</p>
                    <p className="text-white/50 text-sm">@{twitterSession.twitterUsername}</p>
                  </div>
                </div>
                <button
                  onClick={handleTwitterSignOut}
                  className="text-sm text-white/50 hover:text-white"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Step 3: Link Accounts */}
          <div className={`border p-6 ${success ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${success ? 'bg-green-500 text-black' : 'bg-white/10 text-white/50'}`}>
                {success ? '✓' : '3'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Complete Verification</h3>
                <p className="text-sm text-white/50">
                  {success 
                    ? 'Verification complete!'
                    : 'Link your X account to your wallet'}
                </p>
              </div>
            </div>
            
            {!success && walletConnected && twitterConnected && (
              <button
                onClick={handleLinkAccounts}
                disabled={isLinking}
                className="w-full px-6 py-4 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLinking ? 'Verifying...' : 'Complete Verification'}
              </button>
            )}
            
            {!walletConnected || !twitterConnected ? (
              <p className="text-sm text-white/40">
                Complete steps 1 and 2 first.
              </p>
            ) : null}
          </div>
        </div>

        {/* Why verify section */}
        <div className="mt-12 border border-white/10 p-6 bg-white/5">
          <h3 className="text-lg font-semibold text-white mb-4">Why verify?</h3>
          <ul className="space-y-3 text-sm text-white/50">
            <li className="flex items-start gap-3">
              <span className="text-green-400">✓</span>
              <span>Create listings and offer your profile slots for rent</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400">✓</span>
              <span>Build trust with sponsors through verified identity</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400">✓</span>
              <span>Access creator dashboard and analytics</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400">✓</span>
              <span>Get notified about sponsorship opportunities</span>
            </li>
          </ul>
        </div>

        {/* Security note */}
        <div className="mt-6 p-4 border border-white/10 bg-white/5">
          <p className="text-xs text-white/40 text-center">
            🔒 We only request read access to your public profile. We never post on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
}
