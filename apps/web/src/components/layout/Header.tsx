'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '../providers/AuthProvider';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

function isValidAvatarUrl(url: string | null | undefined): boolean {
  return !!(url && 
    !url.includes('default_avatar') && 
    !url.includes('default_profile') &&
    url.startsWith('http'));
}

export function Header() {
  const { isConnected } = useAccount();
  const { user, isLoading, signIn, signOut } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [devDropdownOpen, setDevDropdownOpen] = useState(false);
  const devDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 py-3 sm:py-4">
      <nav 
        className={`
          max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 
          rounded-full border border-white/10
          backdrop-blur-xl bg-white/5
          transition-all duration-300
          ${scrolled ? 'bg-white/10 shadow-lg shadow-black/20' : ''}
        `}
      >
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="X Billboard" 
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            />
            <span className="font-display text-base sm:text-lg font-semibold text-white hidden sm:block">
              X Billboard
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            <NavLink href="/listings">Listings</NavLink>
            <NavLink href="/requests">Requests</NavLink>
            <NavLink href="/how-it-works">How It Works</NavLink>
            <div className="relative" ref={devDropdownRef}>
              <button
                onClick={() => setDevDropdownOpen(!devDropdownOpen)}
                className="px-4 py-2 text-sm text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-all duration-200 flex items-center gap-1"
              >
                Developers
                <svg className={`w-4 h-4 transition-transform ${devDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {devDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 py-2 rounded-xl border border-white/10 backdrop-blur-xl bg-black/90 shadow-xl">
                  <Link href="/x402" onClick={() => setDevDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all">
                    <span className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs">$</span>
                    <div><div className="font-medium">x402 APIs</div><div className="text-xs text-white/40">Pay-per-call</div></div>
                  </Link>
                  <Link href="/mcp" onClick={() => setDevDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all">
                    <span className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs">⚡</span>
                    <div><div className="font-medium">MCP Server</div><div className="text-xs text-white/40">AI Tools</div></div>
                  </Link>
                </div>
              )}
            </div>
            {user && (
              <>
                <NavLink href="/dashboard/sponsor">Bookings</NavLink>
                {user.isCreator && (
                  <NavLink href="/dashboard/creator">Dashboard</NavLink>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {mounted ? (
              <>
                {!isConnected ? (
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <button
                        onClick={openConnectModal}
                        className="h-8 sm:h-9 px-3 sm:px-5 rounded-full bg-white text-black font-medium text-xs sm:text-sm hover:bg-white/90 transition-all"
                      >
                        Connect
                      </button>
                    )}
                  </ConnectButton.Custom>
                ) : !user ? (
                  <button
                    onClick={handleSignIn}
                    disabled={isSigningIn || isLoading}
                    className="h-8 sm:h-9 px-3 sm:px-5 rounded-full bg-white text-black font-medium text-xs sm:text-sm hover:bg-white/90 transition-all disabled:opacity-50"
                  >
                    {isSigningIn ? '...' : 'Sign In'}
                  </button>
                ) : (
                  <Link href="/dashboard/sponsor" className="flex-shrink-0">
                    <div className="flex items-center gap-2 h-8 sm:h-9 px-2 sm:px-3 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-all">
                      {isValidAvatarUrl(user.creatorProfile?.avatarUrl) ? (
                        <img
                          src={user.creatorProfile!.avatarUrl!}
                          alt=""
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white/60">
                          {(user.creatorProfile?.displayName || user.wallet).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs sm:text-sm text-white/90 hidden md:block max-w-[80px] truncate">
                        {user.creatorProfile?.displayName ||
                          `${user.wallet.slice(0, 6)}...`}
                      </span>
                    </div>
                  </Link>
                )}
              </>
            ) : (
              <div className="h-8 sm:h-9 w-20 sm:w-24 rounded-full bg-white/10 animate-pulse" />
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all flex-shrink-0"
              aria-label="Toggle menu"
            >
              <svg 
                className="w-4 h-4 sm:w-5 sm:h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden -z-10"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className="lg:hidden max-w-6xl mx-auto mt-2 p-4 rounded-2xl border border-white/10 backdrop-blur-xl bg-black/90">
            <div className="flex flex-col gap-1">
              <MobileNavLink href="/listings" onClick={() => setMobileMenuOpen(false)}>
                Listings
              </MobileNavLink>
              <MobileNavLink href="/requests" onClick={() => setMobileMenuOpen(false)}>
                Requests
              </MobileNavLink>
              <MobileNavLink href="/how-it-works" onClick={() => setMobileMenuOpen(false)}>
                How It Works
              </MobileNavLink>
              {user && (
                <>
                  <MobileNavLink href="/dashboard/sponsor" onClick={() => setMobileMenuOpen(false)}>
                    My Bookings
                  </MobileNavLink>
                  {user.isCreator && (
                    <MobileNavLink href="/dashboard/creator" onClick={() => setMobileMenuOpen(false)}>
                      Creator Dashboard
                    </MobileNavLink>
                  )}
                  <div className="border-t border-white/10 mt-2 pt-2">
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-sm text-white/50 hover:text-white text-left rounded-lg hover:bg-white/5 transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-all duration-200"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ 
  href, 
  children, 
  onClick 
}: { 
  href: string; 
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
    >
      {children}
    </Link>
  );
}
