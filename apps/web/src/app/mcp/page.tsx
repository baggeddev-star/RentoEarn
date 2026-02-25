'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function MCPPage() {
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
              <span className="text-lg">⚡</span>
              <span className="text-sm font-mono text-signal/70">Model Context Protocol</span>
            </div>
            <h1 className="text-display-xl mb-6">MCP Server</h1>
            <p className="text-xl text-signal/60 max-w-2xl mx-auto font-mono">
              AI-native tools for X Billboard. Let AI agents browse listings, verify profiles, and manage campaigns.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            <ToolCard
              name="verify_x_bio"
              description="Check if a user's X bio contains a specific verification phrase"
              category="Verification"
            />
            <ToolCard
              name="verify_x_header"
              description="Compare X header image against expected banner using perceptual hashing"
              category="Verification"
            />
            <ToolCard
              name="get_x_profile"
              description="Fetch complete X profile data including followers and verification status"
              category="Data"
            />
            <ToolCard
              name="browse_listings"
              description="Search and filter available creator slots on the marketplace"
              category="Marketplace"
            />
            <ToolCard
              name="get_listing"
              description="Get detailed information about a specific listing"
              category="Marketplace"
            />
            <ToolCard
              name="create_campaign"
              description="Create a new advertising campaign on a creator's profile"
              category="Campaigns"
            />
            <ToolCard
              name="defi_swap"
              description="Execute token swaps via ELSA x402 DeFi APIs"
              category="DeFi"
            />
            <ToolCard
              name="defi_portfolio"
              description="Get portfolio balances and token holdings"
              category="DeFi"
            />
            <ToolCard
              name="marketplace_stats"
              description="Get overall marketplace statistics and metrics"
              category="Analytics"
            />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-signal/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-display-md text-center mb-12">Quick Integration</h2>
          <div className="card-terminal p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-signal/10">
              <div className="w-3 h-3 rounded-full bg-signal/20" />
              <div className="w-3 h-3 rounded-full bg-signal/20" />
              <div className="w-3 h-3 rounded-full bg-signal/20" />
              <span className="ml-2 text-xs font-mono text-signal/40">claude_desktop_config.json</span>
            </div>
            <pre className="text-sm font-mono text-signal/80 overflow-x-auto">
{`{
  "mcpServers": {
    "xbillboard": {
      "command": "npx",
      "args": ["-y", "@xbillboard/mcp-server"],
      "env": {
        "RENTOEARN_API_URL": "https://api.xbillboard.xyz",
        "WALLET_PRIVATE_KEY": "your-private-key"
      }
    }
  }
}`}
            </pre>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-signal/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-display-md text-center mb-12">Use Cases</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-lg font-display font-bold mb-2">AI Campaign Manager</h3>
              <p className="text-sm text-signal/60">Let AI agents find the best creators and manage campaigns automatically</p>
            </div>
            <div className="card p-6">
              <div className="text-3xl mb-4">✅</div>
              <h3 className="text-lg font-display font-bold mb-2">Automated Verification</h3>
              <p className="text-sm text-signal/60">AI-powered verification of bio and header compliance</p>
            </div>
            <div className="card p-6">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-display font-bold mb-2">Analytics Assistant</h3>
              <p className="text-sm text-signal/60">Query marketplace data and get insights through natural language</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-signal/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-display-md mb-6">Start Building</h2>
          <p className="text-signal/60 mb-8 font-mono">Connect your AI agent to X Billboard today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/x402" className="btn-primary">View x402 APIs</Link>
            <Link href="/listings" className="btn-secondary">Browse Marketplace</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ToolCard({ name, description, category }: { name: string; description: string; category: string }) {
  return (
    <div className="card p-5 hover:border-signal/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <code className="text-sm font-mono text-signal">{name}</code>
        <span className="text-[10px] font-mono uppercase tracking-wider text-signal/40 px-2 py-1 bg-signal/5 rounded">{category}</span>
      </div>
      <p className="text-sm text-signal/60">{description}</p>
    </div>
  );
}
