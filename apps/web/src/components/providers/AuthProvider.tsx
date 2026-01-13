'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

interface AuthUser {
  wallet: string;
  isCreator: boolean;
  creatorProfile?: {
    xUsername: string;
    displayName: string | null;
    avatarUrl: string | null;
    verified: boolean;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    refreshUser();
  }, []);

  // Handle wallet connection changes
  useEffect(() => {
    if (!connected && user) {
      // Wallet disconnected, sign out
      signOut();
    }
  }, [connected]);

  async function refreshUser() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();

      if (data.success && data.data.authenticated) {
        setUser({
          wallet: data.data.wallet,
          isCreator: data.data.isCreator,
          creatorProfile: data.data.creatorProfile,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn() {
    if (!publicKey || !signMessage) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      // Get nonce
      const nonceRes = await fetch(
        `/api/auth/nonce?publicKey=${publicKey.toBase58()}`,
        { credentials: 'include' }
      );
      const nonceData = await nonceRes.json();

      if (!nonceData.success) {
        throw new Error(nonceData.error || 'Failed to get nonce');
      }

      const { message } = nonceData.data;

      // Sign message
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      const signatureBase58 = bs58.encode(signature);

      // Submit signature
      const signInRes = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message,
          signature: signatureBase58,
          publicKey: publicKey.toBase58(),
        }),
      });

      const signInData = await signInRes.json();

      if (!signInData.success) {
        throw new Error(signInData.error || 'Sign in failed');
      }

      setUser({
        wallet: signInData.data.wallet,
        isCreator: signInData.data.isCreator,
        creatorProfile: signInData.data.creatorProfile,
      });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    try {
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
      setUser(null);
      disconnect();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
