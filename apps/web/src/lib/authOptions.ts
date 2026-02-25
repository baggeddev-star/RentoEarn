import { NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] Twitter sign in:', {
        userId: user.id,
        name: user.name,
        profile: profile,
      });
      return true;
    },
    async jwt({ token, account, profile, user }) {
      if (account && profile) {
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
        token.twitterName = twitterProfile.data?.name || user?.name || undefined;
        token.twitterImage = twitterProfile.data?.profile_image_url || user?.image || undefined;
      }
      return token;
    },
    async session({ session, token }) {
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
    signIn: '/settings/verify',
    error: '/settings/verify',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
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
        maxAge: 60 * 15,
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
        maxAge: 60 * 15,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
