import { Connection, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { SignJWT, jwtVerify } from 'jose';
import { AUTH_MESSAGE_STATEMENT, AUTH_MESSAGE_VALIDITY_MS, SESSION_VALIDITY_MS } from '@shared/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'development-secret-change-in-production'
);

export interface AuthPayload {
  wallet: string;
  iat: number;
  exp: number;
}

/**
 * Generate a sign-in message for wallet signature
 */
export function generateSignInMessage(publicKey: string, nonce: string): string {
  const now = new Date();
  const expiration = new Date(now.getTime() + AUTH_MESSAGE_VALIDITY_MS);

  return `${AUTH_MESSAGE_STATEMENT}

Domain: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
Public Key: ${publicKey}
Nonce: ${nonce}
Issued At: ${now.toISOString()}
Expiration Time: ${expiration.toISOString()}`;
}

/**
 * Verify a signed message from a Solana wallet
 */
export function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = new PublicKey(publicKey).toBytes();

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Parse and validate the sign-in message
 */
export function parseSignInMessage(message: string): {
  valid: boolean;
  publicKey?: string;
  nonce?: string;
  issuedAt?: Date;
  expirationTime?: Date;
} {
  try {
    const lines = message.split('\n');
    const data: Record<string, string> = {};

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        data[key] = value;
      }
    }

    const publicKey = data['Public Key'];
    const nonce = data['Nonce'];
    const issuedAt = data['Issued At'] ? new Date(data['Issued At']) : undefined;
    const expirationTime = data['Expiration Time'] ? new Date(data['Expiration Time']) : undefined;

    // Validate expiration
    if (expirationTime && expirationTime < new Date()) {
      return { valid: false };
    }

    return {
      valid: !!(publicKey && nonce && issuedAt && expirationTime),
      publicKey,
      nonce,
      issuedAt,
      expirationTime,
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Create a JWT session token
 */
export async function createSessionToken(wallet: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ wallet })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + Math.floor(SESSION_VALIDITY_MS / 1000))
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySessionToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      wallet: payload.wallet as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

/**
 * Generate a random nonce for sign-in
 */
export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return bs58.encode(array);
}

/**
 * Get wallet from request cookies
 */
export async function getAuthFromRequest(request: Request): Promise<AuthPayload | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...rest] = c.trim().split('=');
      return [key, rest.join('=')];
    })
  );

  const token = cookies['billboard_session'];
  if (!token) return null;

  return verifySessionToken(token);
}

/**
 * Create session cookie header value
 */
export function createSessionCookie(token: string): string {
  const maxAge = Math.floor(SESSION_VALIDITY_MS / 1000);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `billboard_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

/**
 * Create logout cookie header value
 */
export function createLogoutCookie(): string {
  return 'billboard_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}
