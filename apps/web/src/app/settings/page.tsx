'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-6 border border-white/20 flex items-center justify-center text-3xl">
            🔐
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-white/50 mb-8">
            Connect your wallet and sign in to access settings.
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

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">Settings</h1>
          <p className="text-white/50">
            Manage your account and verification
          </p>
        </div>

        {/* Wallet Info */}
        <div className="border border-white/10 p-6 bg-white/5 mb-6">
          <h2 className="text-sm text-white/40 font-mono uppercase mb-4">Connected Wallet</h2>
          <p className="font-mono text-white break-all">{user.wallet}</p>
        </div>

        {/* X Verification */}
        <div className="border border-white/10 p-6 bg-white/5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm text-white/40 font-mono uppercase mb-2">X Account</h2>
              {user.creatorProfile?.verified ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-white">@{user.creatorProfile.xUsername}</span>
                  <span className="text-white/40 text-sm">Verified</span>
                </div>
              ) : user.creatorProfile?.xUsername ? (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">○</span>
                  <span className="text-white/70">@{user.creatorProfile.xUsername}</span>
                  <span className="text-yellow-400 text-sm">Pending verification</span>
                </div>
              ) : (
                <p className="text-white/50">Not connected</p>
              )}
            </div>
            <Link
              href="/settings/verify"
              className="px-4 py-2 border border-white/30 text-white/70 hover:border-white hover:text-white transition-all text-sm"
            >
              {user.creatorProfile?.verified ? 'View' : 'Verify'}
            </Link>
          </div>
        </div>

        {/* Creator Status */}
        <div className="border border-white/10 p-6 bg-white/5 mb-6">
          <h2 className="text-sm text-white/40 font-mono uppercase mb-4">Creator Status</h2>
          {user.isCreator ? (
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-white">Active Creator</span>
            </div>
          ) : (
            <div>
              <p className="text-white/50 mb-4">
                Verify your X account to become a creator and start listing your profile slots.
              </p>
              <Link
                href="/settings/verify"
                className="inline-block px-4 py-2 border border-white text-white hover:bg-white hover:text-black transition-all text-sm"
              >
                Become a Creator
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="border border-white/10 p-6 bg-white/5">
          <h2 className="text-sm text-white/40 font-mono uppercase mb-4">Quick Links</h2>
          <div className="space-y-2">
            {user.isCreator && (
              <>
                <Link
                  href="/dashboard/creator"
                  className="block px-4 py-3 border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition-all"
                >
                  Creator Dashboard →
                </Link>
                <Link
                  href="/listings/create"
                  className="block px-4 py-3 border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition-all"
                >
                  Create Listing →
                </Link>
              </>
            )}
            <Link
              href="/dashboard/sponsor"
              className="block px-4 py-3 border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition-all"
            >
              Sponsor Dashboard →
            </Link>
            <Link
              href="/requests/create"
              className="block px-4 py-3 border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition-all"
            >
              Create Request →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
