'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function X402Page() {
  return (
    <div className="min-h-screen bg-void text-signal">
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-signal/20 bg-signal/5 mb-6">
              <span className="w-2 h-2 rounded-full bg-signal animate-pulse" />
              <span className="text-sm font-mono text-signal/70">HTTP 402 Payment Required</span>
            </div>
            <h1 className="text-display-xl mb-6">x402 APIs</h1>
            <p className="text-xl text-signal/60 max-w-2xl mx-auto font-mono">
              Pay-per-call APIs powered by stablecoin micropayments. No subscriptions. No API keys. Just pay and use.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <div className="card p-6">
              <h3 className="text-xl font-display font-bold mb-2">Profile Lookup</h3>
              <code className="text-xs font-mono text-signal/50 block mb-4">/api/v1/x/profile</code>
              <div className="text-3xl font-mono font-bold mb-4">$0.001<span className="text-sm text-signal/50">/call</span></div>
              <p className="text-sm text-signal/60">Fetch X profile data including followers, bio, and verification status</p>
            </div>
            <div className="card p-6 border-signal">
              <div className="badge-live mb-4">Popular</div>
              <h3 className="text-xl font-display font-bold mb-2">Bio Verification</h3>
              <code className="text-xs font-mono text-signal/50 block mb-4">/api/v1/x/verify-bio</code>
              <div className="text-3xl font-mono font-bold mb-4">$0.002<span className="text-sm text-signal/50">/call</span></div>
              <p className="text-sm text-signal/60">Verify if a specific phrase exists in a user's X bio</p>
            </div>
            <div className="card p-6">
              <h3 className="text-xl font-display font-bold mb-2">Header Verification</h3>
              <code className="text-xs font-mono text-signal/50 block mb-4">/api/v1/x/verify-header</code>
              <div className="text-3xl font-mono font-bold mb-4">$0.005<span className="text-sm text-signal/50">/call</span></div>
              <p className="text-sm text-signal/60">Perceptual hash comparison of X header images</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-signal/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-display-lg text-center mb-16">How x402 Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-signal/20 mb-4">01</div>
              <h3 className="text-lg font-display font-bold mb-2">Request</h3>
              <p className="text-sm text-signal/60">Make a standard HTTP request to any x402-enabled endpoint</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-signal/20 mb-4">02</div>
              <h3 className="text-lg font-display font-bold mb-2">402 Response</h3>
              <p className="text-sm text-signal/60">Server returns 402 with payment details in headers</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-signal/20 mb-4">03</div>
              <h3 className="text-lg font-display font-bold mb-2">Sign & Pay</h3>
              <p className="text-sm text-signal/60">Your wallet signs a USDC payment transaction</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-signal/20 mb-4">04</div>
              <h3 className="text-lg font-display font-bold mb-2">Access</h3>
              <p className="text-sm text-signal/60">Resend request with payment proof, get your data</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-signal/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-display-md text-center mb-12">Technical Specifications</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="text-label mb-2">Network</div>
              <div className="text-xl font-mono font-bold mb-2">Base Sepolia (Testnet)</div>
              <p className="text-sm text-signal/50">Production will use Base Mainnet</p>
            </div>
            <div className="card p-6">
              <div className="text-label mb-2">Payment Token</div>
              <div className="text-xl font-mono font-bold mb-2">USDC</div>
              <p className="text-sm text-signal/50">Circle's USD Coin on Base</p>
            </div>
            <div className="card p-6">
              <div className="text-label mb-2">Protocol</div>
              <div className="text-xl font-mono font-bold mb-2">HTTP 402</div>
              <p className="text-sm text-signal/50">Standard payment required response</p>
            </div>
            <div className="card p-6">
              <div className="text-label mb-2">Settlement</div>
              <div className="text-xl font-mono font-bold mb-2">Instant</div>
              <p className="text-sm text-signal/50">No waiting for confirmations</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-signal/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-display-md mb-6">Ready to Build?</h2>
          <p className="text-signal/60 mb-8 font-mono">Start integrating x402 payments into your application today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/mcp" className="btn-primary">Explore MCP Tools</Link>
            <a href="https://github.com/coinbase/x402" target="_blank" rel="noopener noreferrer" className="btn-secondary">View on GitHub</a>
          </div>
        </div>
      </section>
    </div>
  );
}
