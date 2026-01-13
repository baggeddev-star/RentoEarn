'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// X Logo SVG Component
const XLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Animated particles using pure CSS/Canvas
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Particles
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particles.forEach((p) => {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.offsetWidth;
        if (p.x > canvas.offsetWidth) p.x = 0;
        if (p.y < 0) p.y = canvas.offsetHeight;
        if (p.y > canvas.offsetHeight) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections between nearby particles
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - dist / 100)})`;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.4 }}
    />
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 overflow-hidden bg-black">
      {/* Particle Background */}
      <div className="absolute inset-0">
        <ParticleBackground />
      </div>

      {/* Large Logo Background */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-[15vw] sm:text-[12vw] font-bold text-white/[0.03] whitespace-nowrap select-none leading-none pb-8"
        >
          BILLBOARD
        </motion.div>
      </div>

      {/* Footer Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Top section */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Left - CTA */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm text-white/40 font-mono">✦ Contact</span>
            <h3 className="text-2xl sm:text-3xl font-semibold text-white mt-2 mb-4">
              Interested in working together,{' '}
              <span className="text-white/50">trying the platform or simply learning more?</span>
            </h3>
            <div className="mt-6">
              <span className="text-xs text-white/40 block mb-2">Contact us at:</span>
              <a 
                href="mailto:hello@billboard.market" 
                className="inline-flex items-center gap-2 text-white hover:text-white/70 transition-colors font-mono text-lg"
              >
                hello@billboard.market
                <span className="text-white/40">↗</span>
              </a>
            </div>
          </motion.div>

          {/* Right - Links */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-8"
          >
            <div>
              <h4 className="text-sm text-white/40 font-mono uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/listings" className="text-white/70 hover:text-white transition-colors flex items-center gap-2 group">
                    Listings
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </Link>
                </li>
                <li>
                  <Link href="/requests" className="text-white/70 hover:text-white transition-colors flex items-center gap-2 group">
                    Requests
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/creator" className="text-white/70 hover:text-white transition-colors flex items-center gap-2 group">
                    Creator Dashboard
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/sponsor" className="text-white/70 hover:text-white transition-colors flex items-center gap-2 group">
                    Sponsor Dashboard
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm text-white/40 font-mono uppercase tracking-wider mb-4">Connect</h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://x.com/billboardmarket" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-white/70 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <XLogo className="w-4 h-4" /> 
                    Twitter
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors flex items-center gap-2 group">
                    Discord
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors flex items-center gap-2 group">
                    Documentation
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors flex items-center gap-2 group">
                    GitHub
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                  </a>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-white/20 flex items-center justify-center">
              <span className="font-bold text-sm text-white">B</span>
            </div>
            <span className="text-sm text-white/40">© 2026 Billboard Market. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Powered by Solana
            </span>
            <span>•</span>
            <span>Escrow Secured</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
