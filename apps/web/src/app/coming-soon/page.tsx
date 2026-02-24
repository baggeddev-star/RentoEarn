import Link from 'next/link';

interface MonetizationOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'LIVE' | 'COMING_SOON';
  category: 'profile' | 'content' | 'engagement';
}

const monetizationOptions: MonetizationOption[] = [
  {
    id: 'header',
    name: 'Profile Header',
    description: 'Rent out your X profile header/banner space for sponsored content',
    icon: '🖼️',
    status: 'LIVE',
    category: 'profile',
  },
  {
    id: 'bio',
    name: 'Bio Link',
    description: 'Add sponsored links or text to your X bio section',
    icon: '📝',
    status: 'LIVE',
    category: 'profile',
  },
  {
    id: 'pinned-tweet',
    name: 'Pinned Tweet',
    description: 'Pin a sponsored tweet to the top of your profile for maximum visibility',
    icon: '📌',
    status: 'COMING_SOON',
    category: 'content',
  },
  {
    id: 'profile-picture',
    name: 'Profile Picture',
    description: 'Temporarily change your PFP to feature a brand or campaign',
    icon: '👤',
    status: 'COMING_SOON',
    category: 'profile',
  },
  {
    id: 'display-name',
    name: 'Display Name',
    description: 'Add a sponsor mention or tag to your display name',
    icon: '✏️',
    status: 'COMING_SOON',
    category: 'profile',
  },
  {
    id: 'location',
    name: 'Location Field',
    description: 'Feature a brand or campaign in your location field',
    icon: '📍',
    status: 'COMING_SOON',
    category: 'profile',
  },
  {
    id: 'website-link',
    name: 'Website Link',
    description: 'Add a sponsored URL to your profile website field',
    icon: '🔗',
    status: 'COMING_SOON',
    category: 'profile',
  },
  {
    id: 'tweet-content',
    name: 'Sponsored Tweets',
    description: 'Create and post sponsored tweet content for brands',
    icon: '💬',
    status: 'COMING_SOON',
    category: 'content',
  },
  {
    id: 'reply-mentions',
    name: 'Reply Mentions',
    description: 'Mention sponsors in your replies to high-engagement tweets',
    icon: '💭',
    status: 'COMING_SOON',
    category: 'engagement',
  },
  {
    id: 'retweet-campaigns',
    name: 'Retweet Campaigns',
    description: 'Retweet and amplify sponsor content to your audience',
    icon: '🔄',
    status: 'COMING_SOON',
    category: 'engagement',
  },
  {
    id: 'thread-sponsorship',
    name: 'Thread Sponsorship',
    description: 'Create sponsored educational or informational threads',
    icon: '🧵',
    status: 'COMING_SOON',
    category: 'content',
  },
  {
    id: 'space-hosting',
    name: 'Space Hosting',
    description: 'Host X Spaces with sponsored topics or brand mentions',
    icon: '🎙️',
    status: 'COMING_SOON',
    category: 'engagement',
  },
];

export default function ComingSoonPage() {
  const liveOptions = monetizationOptions.filter(opt => opt.status === 'LIVE');
  const comingSoonOptions = monetizationOptions.filter(opt => opt.status === 'COMING_SOON');

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link 
          href="/" 
          className="text-sm text-white/40 hover:text-white transition-colors font-mono"
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="mt-8 mb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Monetize Everything
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            Turn every part of your X profile into a revenue stream. 
            We&apos;re building the ultimate creator monetization platform.
          </p>
        </div>

        {/* Live Options */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-400 text-sm font-mono">
              LIVE NOW
            </span>
            <h2 className="text-2xl font-bold text-white">Available Today</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveOptions.map((option) => (
              <Link 
                key={option.id} 
                href={option.id === 'header' ? '/listings' : '/requests'}
                className="group h-full"
              >
                <div className="border border-green-500/30 bg-green-500/5 p-8 hover:border-green-500/60 hover:bg-green-500/10 transition-all duration-300 h-full flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 flex items-center justify-center bg-green-500/10 border border-green-500/30 rounded-lg">
                      <span className="text-3xl">{option.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-white">{option.name}</h3>
                        <span className="px-2 py-0.5 bg-green-500 text-black text-xs font-bold">
                          LIVE
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-white/60 flex-1 min-h-[48px]">{option.description}</p>
                  <div className="mt-6 pt-4 border-t border-green-500/20">
                    <span className="text-green-400 text-sm font-mono group-hover:underline">
                      Start earning →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Coming Soon Options */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <span className="px-3 py-1 bg-white/10 border border-white/20 text-white/60 text-sm font-mono">
              COMING SOON
            </span>
            <h2 className="text-2xl font-bold text-white">On the Roadmap</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comingSoonOptions.map((option) => (
              <div 
                key={option.id}
                className="border border-white/10 bg-white/5 p-5 opacity-70 hover:opacity-100 transition-opacity duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl grayscale">{option.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white truncate">{option.name}</h3>
                    </div>
                    <p className="text-sm text-white/40 line-clamp-2">{option.description}</p>
                    <div className="mt-3">
                      <span className="px-2 py-0.5 border border-white/20 text-white/40 text-xs font-mono">
                        COMING SOON
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center border border-white/20 p-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            Want Early Access?
          </h2>
          <p className="text-white/50 mb-8 max-w-lg mx-auto">
            Join our waitlist to be the first to know when new monetization options launch. 
            Early adopters get priority access and reduced fees.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/listings"
              className="px-8 py-4 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all"
            >
              Browse Listings
            </Link>
            <Link
              href="/requests"
              className="px-8 py-4 border border-white/30 text-white hover:border-white transition-all"
            >
              View Requests
            </Link>
          </div>
        </div>

        {/* Stats/Social Proof */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 border border-white/10">
            <div className="text-3xl font-bold text-white mb-1">2</div>
            <div className="text-sm text-white/40">Live Features</div>
          </div>
          <div className="p-6 border border-white/10">
            <div className="text-3xl font-bold text-white mb-1">10+</div>
            <div className="text-sm text-white/40">Coming Soon</div>
          </div>
          <div className="p-6 border border-white/10">
            <div className="text-3xl font-bold text-white mb-1">∞</div>
            <div className="text-sm text-white/40">Earning Potential</div>
          </div>
          <div className="p-6 border border-white/10">
            <div className="text-3xl font-bold text-white mb-1">0%</div>
            <div className="text-sm text-white/40">Platform Fee*</div>
          </div>
        </div>
        <p className="text-center text-xs text-white/30 mt-4">
          *During beta period. Standard fees apply after launch.
        </p>
      </div>
    </div>
  );
}
