import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    twitterId?: string;
    twitterUsername?: string;
    twitterName?: string;
    twitterImage?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    twitterId?: string;
    twitterUsername?: string;
    twitterName?: string;
    twitterImage?: string;
  }
}
