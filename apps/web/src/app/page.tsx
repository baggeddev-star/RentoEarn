'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Footer } from '@/components/layout/Footer';

// X Logo SVG Component
const XLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Rotating words for the hero
const rotatingWords = ['Profile', 'Bio', 'Header', 'Pinned Tweet', 'Content'];

// Sample avatar URLs
const avatarSeeds = [
  'Felix', 'Aneka', 'Luna', 'Max', 'Zoe', 'Oscar', 'Bella', 'Charlie',
  'Ruby', 'Leo', 'Mia', 'Jack', 'Sophie', 'Oliver', 'Emma', 'Noah',
  'Ava', 'Liam', 'Chloe', 'Mason', 'Lily', 'Ethan', 'Grace', 'Lucas'
];

const generateAvatars = (style: string, seeds: string[]) => 
  seeds.map(seed => `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=1a1a1a,2a2a2a,0a0a0a`);

const row1Avatars = generateAvatars('avataaars', avatarSeeds.slice(0, 8));
const row2Avatars = generateAvatars('lorelei', avatarSeeds.slice(8, 16));
const row3Avatars = generateAvatars('notionists', avatarSeeds.slice(16, 24));

// Stats type
interface PlatformStats {
  totalListings: number;
  activeCampaigns: number;
  formatted: {
    totalVolumeEth: string;
    lockedEth: string;
    volume24hEth: string;
  };
}

// Horizontal scrolling row component
function HorizontalScrollingRow({ 
  avatars, 
  speed = 30, 
  reverse = false 
}: { 
  avatars: string[]; 
  speed?: number; 
  reverse?: boolean;
}) {
  return (
    <div className="overflow-hidden">
      <div 
        className={`flex gap-4 sm:gap-6 ${reverse ? 'animate-scroll-right' : 'animate-scroll-left'}`}
        style={{ 
          animationDuration: `${speed}s`,
          width: 'max-content'
        }}
      >
        {[...avatars, ...avatars, ...avatars].map((avatar, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 border border-white/10 bg-white/5 transition-all duration-300"
          >
            <img src={avatar} alt="" className="w-full h-full object-cover opacity-60" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Cube flip card for journey section
function JourneyCard({ 
  number, 
  title, 
  description, 
  icon,
  delay = 0 
}: { 
  number: string; 
  title: string; 
  description: string;
  icon: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, rotateY: -90, z: -100 }}
      animate={isInView ? { opacity: 1, rotateY: 0, z: 0 } : {}}
      transition={{ 
        duration: 0.8, 
        delay: delay,
        type: "spring",
        stiffness: 100
      }}
      style={{ perspective: 1000 }}
      className="relative"
    >
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        animate={{ 
          rotateY: isHovered ? 10 : 0,
          scale: isHovered ? 1.02 : 1,
          z: isHovered ? 50 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="border border-white/20 bg-black p-8 h-full cursor-pointer group"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Number badge */}
        <div className="absolute -top-3 -left-3 w-10 h-10 bg-white text-black flex items-center justify-center font-mono text-sm font-bold">
          {number}
        </div>

        {/* Icon */}
        <div className="mb-6 text-white/80 group-hover:text-white transition-colors">
          {icon}
        </div>

        <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">
          {description}
        </p>

        {/* Decorative corner */}
        <div className="absolute bottom-0 right-0 w-16 h-16 border-t border-l border-white/10 group-hover:border-white/30 transition-colors" />
      </motion.div>
    </motion.div>
  );
}

// Stats display component
function StatsDisplay({ stats }: { stats: PlatformStats | null }) {
  if (!stats) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-6 py-4 border border-white/10 bg-black/50 backdrop-blur-sm animate-pulse">
            <div className="h-6 w-20 bg-white/10 mb-2" />
            <div className="h-3 w-16 bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
    >
      <StatBox 
        value={stats.formatted.volume24hEth} 
        label="24h Volume" 
        suffix="ETH" 
      />
      <StatBox 
        value={stats.formatted.totalVolumeEth} 
        label="All Time" 
        suffix="ETH" 
      />
      <StatBox 
        value={stats.formatted.lockedEth} 
        label="Locked" 
        suffix="ETH" 
      />
    </motion.div>
  );
}

function StatBox({ value, label, suffix }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="px-6 py-4 border border-white/20 bg-black/50 backdrop-blur-sm">
      <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">
        {value} {suffix}
      </div>
      <div className="text-xs text-white/40 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  // Fetch stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }
    fetchStats();
  }, []);

  // Rotate words every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setIsAnimating(false);
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-screen flex flex-col"
      >
        {/* Scrolling Tiles Background */}
        <div className="absolute inset-0 flex flex-col justify-center gap-4 sm:gap-6 pointer-events-none">
          <HorizontalScrollingRow avatars={row1Avatars} speed={50} />
          <HorizontalScrollingRow avatars={row2Avatars} speed={40} reverse />
          <HorizontalScrollingRow avatars={row3Avatars} speed={45} />
        </div>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70 pointer-events-none" />

        {/* Hero Content - Centered */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 pt-24">
          <div className="text-center max-w-4xl">
            {/* Overline */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-white/30 bg-black/50 backdrop-blur-sm mb-8"
            >
              <span className="w-2 h-2 bg-green-400 animate-pulse" />
              <span className="text-sm text-white/80 font-mono">LIVE ON BASE</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6"
            >
              Rent Your
              <br />
              <span className="inline-flex items-center justify-center gap-3 sm:gap-4 mt-2">
                <XLogo className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 text-white" />
                <span 
                  className={`
                    inline-block min-w-[160px] sm:min-w-[220px] md:min-w-[280px] text-white
                    transition-all duration-300
                    ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
                  `}
                >
                  {rotatingWords[currentWordIndex]}
                </span>
              </span>
            </motion.h1>

            {/* Subheadline - Enhanced visibility */}
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed px-4 drop-shadow-lg"
            >
              The marketplace for X profile rentals. Creators monetize their reach,
              sponsors find their audience. <span className="text-white font-medium">Secured by Base escrow.</span>
            </motion.p>

            {/* CTAs - Boxy */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Link 
                href="/listings" 
                className="w-full sm:w-auto px-8 py-4 border-2 border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-all text-center"
              >
                Browse Listings
              </Link>
              <Link 
                href="/requests" 
                className="w-full sm:w-auto px-8 py-4 border border-white/50 text-white font-semibold hover:border-white hover:bg-white/10 transition-all text-center"
              >
                View Requests
              </Link>
            </motion.div>

            {/* Stats - Real data */}
            <StatsDisplay stats={stats} />

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-6 h-10 border border-white/30 rounded-full flex items-start justify-center p-2"
              >
                <motion.div className="w-1 h-2 bg-white/50 rounded-full" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Journey Section - Three Steps */}
      <section className="relative py-32 border-t border-white/10">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent hidden lg:block" />
        
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <span className="text-sm text-white/40 uppercase tracking-[0.3em] font-mono">The Journey</span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mt-4">
              Three Steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <JourneyCard
              number="01"
              title="For Creators"
              description="List your header or bio slot, set your price, and get paid in ETH after each successful campaign."
              delay={0}
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              }
            />
            <JourneyCard
              number="02"
              title="For Sponsors"
              description="Browse verified creators, book slots with ETH escrow, and get automated banner verification."
              delay={0.2}
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <JourneyCard
              number="03"
              title="Trustless Security"
              description="On-chain escrow with perceptual hash verification. Automatic refunds if terms aren't met."
              delay={0.4}
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm text-white/40 uppercase tracking-[0.3em] font-mono">Get Started</span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mt-4 mb-6">
              Ready to Earn?
            </h2>
            <p className="text-lg text-white/60 mb-10">
              Connect your wallet and start earning or advertising today.
            </p>
            <Link 
              href="/listings" 
              className="inline-block px-10 py-5 border-2 border-white bg-white text-black font-semibold text-lg hover:bg-transparent hover:text-white transition-all"
            >
              Explore Marketplace →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
