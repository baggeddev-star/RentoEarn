import NextAuth, { NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

/**
 * NextAuth configuration for Twitter OAuth login.
 * This allows users to verify their X account ownership by signing in with Twitter.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0', // Use OAuth 2.0
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow sign in - we'll link the account later when they connect wallet
      console.log('[NextAuth] Twitter sign in:', {
        userId: user.id,
        name: user.name,
        profile: profile,
      });
      return true;
    },
    async jwt({ token, account, profile, user }) {
      // Persist Twitter data in the token
      if (account && profile) {
        // Twitter OAuth 2.0 profile structure
        const twitterProfile = profile as {
          data?: {
            id: string;
            username: string;
            name: string;
            profile_image_url?: string;
          };
        };

        token.twitterId = twitterProfile.data?.id || account.providerAccountId;
        token.twitterUsername = twitterProfile.data?.username || (profile as { screen_name?: string }).screen_name;
        token.twitterName = twitterProfile.data?.name || user?.name;
        token.twitterImage = twitterProfile.data?.profile_image_url || user?.image;
      }
      return token;
    },
    async session({ session, token }) {
      // Add Twitter data to session
      return {
        ...session,
        twitterId: token.twitterId as string | undefined,
        twitterUsername: token.twitterUsername as string | undefined,
        twitterName: token.twitterName as string | undefined,
        twitterImage: token.twitterImage as string | undefined,
      };
    },
  },
  pages: {
    signIn: '/settings/verify', // Redirect to our custom verify page
    error: '/settings/verify', // Redirect errors to verify page
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    // Fix for localhost cookie issues
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Set to false for localhost
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: false,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
        maxAge: 60 * 15, // 15 minutes
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
        maxAge: 60 * 15, // 15 minutes
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
