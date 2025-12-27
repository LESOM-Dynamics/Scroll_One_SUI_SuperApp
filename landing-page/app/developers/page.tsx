"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Code,
  Book,
  Terminal,
  Zap,
  ArrowRight,
  Check,
  Github,
  FileCode,
  Webhook,
  Settings,
  Shield,
  Globe,
  Link2,
  Copy,
  ExternalLink,
  Menu,
  X,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function DevelopersPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    integration: `// Add your dApp to miniapps/registry.ts
import { type MiniApp } from '@/store/miniAppStore';

export const MINIAPPS: MiniApp[] = [
  // ... existing apps
  {
    id: 'your-app-id',
    name: 'Your App Name',
    url: 'https://yourapp.com',
    icon: '🎯', // Emoji or image URL
    description: 'Your app description',
    category: 'DeFi', // DeFi, Lending, Bridge, NFT, Tools, etc.
    featured: false, // Set to true for featured apps
    verified: true, // Set to true after verification
  },
];`,
    bridge: `// ScrollOne Bridge API v1.0.0 (automatically injected)
// Wait for bridge to be ready
window.addEventListener('scrollOneReady', () => {
  console.log('Scroll One bridge ready!');
  initializeApp();
});

// Or check if already ready
if (window.scrollOne?.isScrollOne) {
  initializeApp();
}

async function initializeApp() {
  try {
    // Get connected account
    const account = await window.scrollOne.getAccount();
    console.log('Address:', account.address);
    console.log('Connected:', account.isConnected);
    
    // Get ETH balance
    const balance = await window.scrollOne.getBalance();
    console.log('Balance:', balance.formatted, balance.symbol);
    
    // Get network info
    const network = await window.scrollOne.getNetwork();
    console.log('Chain ID:', network.chainId);
    console.log('Network:', network.chainName);
    
    // Estimate gas before sending
    const gasEstimate = await window.scrollOne.estimateGas({
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      value: '0.01',
    });
    console.log('Gas estimate:', gasEstimate.estimatedFee);
    
    // Sign and send transaction (requires user approval)
    const result = await window.scrollOne.signTransaction({
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      value: '0.01', // ETH amount as string
      data: '0x...', // Optional contract call data
    });
    console.log('Transaction hash:', result.hash);
    
    // Sign message
    const signature = await window.scrollOne.signMessage('Hello, Scroll!');
    console.log('Signature:', signature.signature);
    
    // Request notification from mini-app
    const notification = await window.scrollOne.requestNotification({
      title: 'DeFi Position Updated',
      body: 'Your liquidity position has been updated',
      data: {
        type: 'defi_update',
        poolId: '0x123...',
      },
      sound: true, // Optional, defaults to true
    });
    console.log('Notification sent:', notification.success);
    
    // Listen for events
    window.scrollOne.on('accountChanged', (data) => {
      console.log('Account changed:', data.address);
    });
    
    window.scrollOne.on('networkChanged', (data) => {
      console.log('Network changed:', data.chainId);
    });
    
    window.scrollOne.on('walletLocked', () => {
      console.log('Wallet was locked');
    });
    
    window.scrollOne.on('walletUnlocked', () => {
      console.log('Wallet was unlocked');
    });
  } catch (error) {
    console.error('Bridge error:', error.code, error.message);
  }
}`,
    sdk: `// ScrollOne SDK v1.0.0 - Complete Integration Example
// No installation needed - bridge is automatically injected

// 1. Check if bridge is available
if (typeof window !== 'undefined' && window.scrollOne?.isScrollOne) {
  console.log('SDK Version:', window.scrollOne.version);
  
  // 2. Access current state (read-only)
  console.log('Wallet Address:', window.scrollOne.walletAddress);
  console.log('Chain ID:', window.scrollOne.chainId);
  console.log('Is Connected:', window.scrollOne.isConnected);
  console.log('Is Wallet Locked:', window.scrollOne.isWalletLocked);
  
  // 3. Get account info
  const account = await window.scrollOne.getAccount();
  // Returns: { address: string | null, isConnected: boolean }
  
  // 4. Get balance (ETH only, token support coming soon)
  const balance = await window.scrollOne.getBalance();
  // Returns: { balance: string, formatted: string, symbol: string }
  
  // 5. Get network information
  const network = await window.scrollOne.getNetwork();
  // Returns: { chainId: number, chainName: string, rpcUrl: string, isTestnet: boolean }
  
  // 6. Estimate gas for transaction
  const gasEstimate = await window.scrollOne.estimateGas({
    to: '0x...',
    value: '0.1', // ETH as string
    data: '0x...', // Optional
  });
  // Returns: { gasLimit: string, gasPrice: string, estimatedFee: string }
  
  // 7. Sign message
  const signature = await window.scrollOne.signMessage('Hello, Scroll!');
  // Returns: { signature: string }
  
  // 8. Sign transaction (requires user approval)
  const txResult = await window.scrollOne.signTransaction({
    to: '0x...',
    value: '0.1', // ETH as string
    data: '0x...', // Optional contract call
    gasLimit: '21000', // Optional
    gasPrice: '20000000000', // Optional
  });
  // Returns: { hash: string, from: string, to: string | null }
  
  // 9. Event handling
  window.scrollOne.on('accountChanged', (data) => {
    console.log('Account changed to:', data.address);
  });
  
  // Clean up listeners
  window.scrollOne.off('accountChanged', callback);
} else {
  console.warn('Scroll One bridge not available');
}`
  };

  return (
    <main className="min-h-screen bg-background-primary text-text-primary overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(229,231,235,0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(229,231,235,0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        <motion.div 
          className="absolute top-20 left-[10%] w-64 h-64 bg-accent-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: 9999, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-40 right-[15%] w-80 h-80 bg-accent-primary/8 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{ duration: 25, repeat: 9999, ease: "easeInOut" }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-background-primary/80 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3 group">
              <motion.div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-accent-primary/30 relative overflow-hidden"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <Image 
                  src="/logo.png" 
                  alt="Scroll One Logo" 
                  width={40} 
                  height={40}
                  className="object-contain"
                  priority
                />
              </motion.div>
              <div>
                <span className="text-2xl font-bold gradient-text block">Scroll One</span>
                <span className="text-[10px] text-text-tertiary font-mono">superapp</span>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/#features" className="text-text-secondary hover:text-accent-primary transition-colors font-medium text-sm">Features</Link>
              <Link href="/#ecosystem" className="text-text-secondary hover:text-accent-primary transition-colors font-medium text-sm">Ecosystem</Link>
              <Link href="/developers" className="text-accent-primary font-medium text-sm relative">
                Developers
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-primary"></span>
              </Link>
              <Link href="/#download" className="text-text-secondary hover:text-accent-primary transition-colors font-medium text-sm">Download</Link>
              <Link
                href="/#download"
                className="px-6 py-2.5 bg-gradient-scroll text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-accent-primary/30 transition-all hover:scale-105"
              >
                Get Started
              </Link>
            </div>

            <button
              className="md:hidden text-text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden backdrop-blur-xl bg-background-primary/95 border-t border-border-subtle p-6"
          >
            <div className="flex flex-col space-y-4">
              <Link href="/#features" className="text-text-secondary hover:text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</Link>
              <Link href="/#ecosystem" className="text-text-secondary hover:text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Ecosystem</Link>
              <Link href="/developers" className="text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Developers</Link>
              <Link href="/#download" className="text-text-secondary hover:text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Download</Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">FOR DEVELOPERS</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent-primary/20"></div>
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.95] tracking-tight">
              Build on <span className="gradient-text">Scroll</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-10 leading-relaxed max-w-3xl">
              Integrate your dApp into Scroll One SuperApp and reach thousands of users. 
              Simple SDK v1.0.0, powerful tools, endless possibilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.a
                href="#get-started"
                className="px-8 py-4 bg-gradient-scroll text-white rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 shadow-2xl shadow-accent-primary/30"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="https://docs.scroll.io"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 glass border-2 border-border-subtle text-text-primary rounded-2xl font-semibold text-lg flex items-center justify-center space-x-3 hover:border-accent-primary/50 transition-all backdrop-blur-xl"
                whileHover={{ scale: 1.05 }}
              >
                <Book className="w-5 h-5" />
                <span>Scroll Docs</span>
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Start */}
      <section id="get-started" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">QUICK START</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent-primary/20"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              Get Started in <span className="gradient-text">5 Minutes</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                step: "01",
                title: "Add to Registry",
                description: "Add your dApp to the Scroll One registry",
                icon: FileCode,
                color: "from-blue-500 to-cyan-500"
              },
              {
                step: "02",
                title: "Integrate Bridge",
                description: "Use window.scrollOne API in your dApp",
                icon: Webhook,
                color: "from-purple-500 to-pink-500"
              },
              {
                step: "03",
                title: "Test & Deploy",
                description: "Test your integration and deploy",
                icon: Terminal,
                color: "from-green-500 to-emerald-500"
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-3xl p-8 border border-border-subtle backdrop-blur-xl hover:border-accent-primary/30 transition-all"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-black gradient-text mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold mb-3 text-text-primary">{item.title}</h3>
                <p className="text-text-secondary">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Onboarding Process */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-background-secondary/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">ONBOARDING</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent-primary/20"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              Add Your <span className="gradient-text">dApp</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mb-12">
              To add your dApp to Scroll One SuperApp, follow these steps:
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {[
              {
                step: "1",
                title: "Prepare Your dApp",
                description: "Ensure your dApp is live on Scroll network and integrates with window.scrollOne bridge API",
                details: [
                  "dApp must be accessible via HTTPS",
                  "Must work in WebView environment",
                  "Should integrate with ScrollOne bridge API (window.scrollOne)",
                  "Use SDK v1.0.0 methods: getAccount, getBalance, signTransaction, etc."
                ]
              },
              {
                step: "2",
                title: "Submit for Review",
                description: "Contact us with your dApp details for verification",
                details: [
                  "Email: dev@scrollone.app",
                  "Include: App name, URL, description, category",
                  "Ensure your dApp uses window.scrollOne API",
                  "We'll review and add to the registry"
                ]
              },
              {
                step: "3",
                title: "Registry Addition",
                description: "Once approved, your dApp is added to the MiniApp registry",
                details: [
                  "Added to miniapps/registry.ts",
                  "Appears in Explore tab",
                  "Available to all Scroll One users"
                ]
              },
              {
                step: "4",
                title: "Verification Badge",
                description: "Verified dApps get a verification badge and featured placement",
                details: [
                  "Verified badge displayed",
                  "Eligible for featured section",
                  "Higher visibility in search"
                ]
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-3xl p-8 border border-border-subtle backdrop-blur-xl hover:border-accent-primary/30 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-scroll rounded-xl flex items-center justify-center text-white font-black text-xl">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary">{item.title}</h3>
                </div>
                <p className="text-text-secondary mb-4">{item.description}</p>
                <ul className="space-y-2">
                  {item.details.map((detail, i) => (
                    <li key={i} className="flex items-start text-sm text-text-secondary">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-primary mr-2 mt-1.5 flex-shrink-0"></div>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-background-secondary/30 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">API REFERENCE</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent-primary/20"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              Available <span className="gradient-text">Methods</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mb-12">
              ScrollOne SDK v1.0.0 provides the following methods for dApp integration:
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {[
              {
                method: "getAccount()",
                description: "Get connected wallet address",
                returns: "{ address: string | null, isConnected: boolean }",
                example: "const account = await window.scrollOne.getAccount();"
              },
              {
                method: "getBalance(tokenAddress?)",
                description: "Get ETH balance (token support coming soon)",
                returns: "{ balance: string, formatted: string, symbol: string }",
                example: "const balance = await window.scrollOne.getBalance();"
              },
              {
                method: "getNetwork()",
                description: "Get current network information",
                returns: "{ chainId: number, chainName: string, rpcUrl: string, isTestnet: boolean }",
                example: "const network = await window.scrollOne.getNetwork();"
              },
              {
                method: "signTransaction(tx)",
                description: "Sign and send transaction (requires user approval)",
                returns: "{ hash: string, from: string, to: string | null }",
                example: "const result = await window.scrollOne.signTransaction({ to: '0x...', value: '0.1' });"
              },
              {
                method: "requestNotification(notification)",
                description: "Request a notification from mini-app",
                returns: "{ success: boolean, notificationId?: string }",
                example: "const result = await window.scrollOne.requestNotification({ title: 'Update', body: 'Message' });"
              },
              {
                method: "signMessage(message)",
                description: "Sign an arbitrary message",
                returns: "{ signature: string }",
                example: "const sig = await window.scrollOne.signMessage('Hello');"
              },
              {
                method: "estimateGas(tx)",
                description: "Estimate gas for a transaction",
                returns: "{ gasLimit: string, gasPrice: string, estimatedFee: string }",
                example: "const gas = await window.scrollOne.estimateGas({ to: '0x...', value: '0.1' });"
              },
              {
                method: "signTypedData(domain, types, value)",
                description: "Sign EIP-712 typed data (coming soon)",
                returns: "{ signature: string }",
                example: "const sig = await window.scrollOne.signTypedData(domain, types, value);",
                comingSoon: true
              },
            ].map((api, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-6 border border-border-subtle backdrop-blur-xl hover:border-accent-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <code className="text-lg font-bold text-accent-primary">{api.method}</code>
                  {api.comingSoon && (
                    <span className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded-full">Coming Soon</span>
                  )}
                </div>
                <p className="text-text-secondary mb-4">{api.description}</p>
                <div className="mb-3">
                  <p className="text-xs text-text-tertiary mb-1">Returns:</p>
                  <code className="text-xs text-text-primary bg-background-tertiary/50 px-2 py-1 rounded">{api.returns}</code>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Example:</p>
                  <code className="text-xs text-text-primary bg-background-tertiary/50 px-2 py-1 rounded block">{api.example}</code>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">CODE EXAMPLES</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent-primary/20"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              Simple <span className="gradient-text">Integration</span>
            </h2>
          </motion.div>

          <div className="space-y-8">
            {[
              {
                title: "Add Your dApp to Registry",
                description: "Register your dApp in the Scroll One MiniApp registry",
                code: codeExamples.integration,
                id: "integration"
              },
              {
                title: "ScrollOne Bridge API",
                description: "Access wallet features from your dApp using window.scrollOne",
                code: codeExamples.bridge,
                id: "bridge"
              },
              {
                title: "Bridge Integration",
                description: "Complete example of integrating with the ScrollOne bridge",
                code: codeExamples.sdk,
                id: "sdk"
              },
            ].map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-3xl p-8 border border-border-subtle backdrop-blur-xl"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-text-primary">{example.title}</h3>
                    <p className="text-text-secondary">{example.description}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(example.code, example.id)}
                    className="glass rounded-lg p-2 hover:bg-accent-primary/20 transition-colors border border-border-subtle"
                  >
                    {copiedCode === example.id ? (
                      <Check className="w-5 h-5 text-accent-primary" />
                    ) : (
                      <Copy className="w-5 h-5 text-text-secondary" />
                    )}
                  </button>
                </div>
                <pre className="bg-background-tertiary/50 rounded-xl p-6 overflow-x-auto border border-border-subtle">
                  <code className="text-sm text-text-primary font-mono">{example.code}</code>
                </pre>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Events & Error Handling */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-background-secondary/30 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">EVENTS & ERRORS</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent-primary/20"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              Events & <span className="gradient-text">Error Handling</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-3xl p-8 border border-border-subtle backdrop-blur-xl"
            >
              <h3 className="text-2xl font-bold mb-6 text-text-primary">Available Events</h3>
              <div className="space-y-4">
                {[
                  { event: 'scrollOneReady', description: 'Fired when bridge is initialized and ready' },
                  { event: 'accountChanged', description: 'Fired when wallet address changes', data: '{ address: string | null }' },
                  { event: 'networkChanged', description: 'Fired when network/chain changes', data: '{ chainId: number }' },
                  { event: 'walletLocked', description: 'Fired when wallet is locked' },
                  { event: 'walletUnlocked', description: 'Fired when wallet is unlocked' },
                ].map((evt, i) => (
                  <div key={i} className="border-l-2 border-accent-primary/30 pl-4">
                    <code className="text-accent-primary font-mono text-sm font-bold">{evt.event}</code>
                    <p className="text-text-secondary text-sm mt-1">{evt.description}</p>
                    {evt.data && (
                      <code className="text-xs text-text-tertiary block mt-1">Data: {evt.data}</code>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-background-tertiary/50 rounded-xl">
                <p className="text-xs text-text-tertiary mb-2">Example:</p>
                <code className="text-xs text-text-primary block">
                  {`window.scrollOne.on('accountChanged', (data) => {
  console.log('New address:', data.address);
});`}
                </code>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-3xl p-8 border border-border-subtle backdrop-blur-xl"
            >
              <h3 className="text-2xl font-bold mb-6 text-text-primary">Error Codes</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {[
                  { code: 'WALLET_NOT_CONNECTED', desc: 'No wallet connected' },
                  { code: 'WALLET_LOCKED', desc: 'Wallet is locked' },
                  { code: 'USER_REJECTED', desc: 'User rejected the request' },
                  { code: 'TRANSACTION_FAILED', desc: 'Transaction execution failed' },
                  { code: 'INSUFFICIENT_BALANCE', desc: 'Insufficient balance' },
                  { code: 'GAS_ESTIMATION_FAILED', desc: 'Gas estimation failed' },
                  { code: 'SIGN_FAILED', desc: 'Message signing failed' },
                  { code: 'NETWORK_ERROR', desc: 'Network request failed' },
                  { code: 'TIMEOUT', desc: 'Request timeout' },
                  { code: 'INVALID_MESSAGE', desc: 'Invalid message format' },
                  { code: 'UNSUPPORTED_METHOD', desc: 'Method not supported' },
                  { code: 'RATE_LIMIT_EXCEEDED', desc: 'Notification rate limit exceeded (max 5/min)' },
                  { code: 'INVALID_PAYLOAD', desc: 'Invalid notification payload (missing title/body)' },
                ].map((err, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <code className="text-xs text-accent-primary font-mono flex-shrink-0 w-32">{err.code}</code>
                    <span className="text-xs text-text-secondary">{err.desc}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-background-tertiary/50 rounded-xl">
                <p className="text-xs text-text-tertiary mb-2">Example:</p>
                <code className="text-xs text-text-primary block">
                  {`try {
  await window.scrollOne.signTransaction(tx);
} catch (error) {
  if (error.code === 'USER_REJECTED') {
    // User rejected
  } else if (error.code === 'WALLET_LOCKED') {
    // Wallet locked
  }
}`}
                </code>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features for Developers */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">DEVELOPER FEATURES</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent-primary/20"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              Everything You <span className="gradient-text">Need</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Code,
                title: "No Installation Required",
                description: "window.scrollOne v1.0.0 is automatically injected into your dApp",
                features: ["Zero dependencies", "Automatic initialization", "Type-safe APIs", "SDK v1.0.0"]
              },
              {
                icon: Webhook,
                title: "ScrollOne Bridge",
                description: "Seamless communication between your dApp and Scroll One wallet",
                features: ["Wallet integration", "Transaction signing", "Event handling", "Notification support", "8 core methods"]
              },
              {
                icon: Shield,
                title: "Secure by Default",
                description: "Built-in security features and best practices",
                features: ["Encrypted communication", "Permission system", "Sandboxed execution"]
              },
              {
                icon: Settings,
                title: "Easy Configuration",
                description: "Configure your app with simple JSON files",
                features: ["App registry", "Metadata management", "Version control"]
              },
              {
                icon: Globe,
                title: "Cross-Platform",
                description: "Works on iOS, Android, and Web",
                features: ["Single codebase", "Platform-specific APIs", "Universal bridge"]
              },
              {
                icon: Link2,
                title: "Deep Linking",
                description: "Deep link into your app from anywhere",
                features: ["Custom URLs", "Parameter passing", "Navigation support"]
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-3xl p-8 border border-border-subtle backdrop-blur-xl hover:border-accent-primary/30 transition-all group"
              >
                <div className="w-14 h-14 bg-gradient-scroll rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-text-primary">{feature.title}</h3>
                <p className="text-text-secondary mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center text-sm text-text-secondary">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-primary mr-2"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Links */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-background-secondary/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16 text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-accent-primary"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">RESOURCES</span>
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              Learn <span className="gradient-text">More</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "Scroll Documentation",
                description: "Complete guide to building on Scroll blockchain",
                href: "https://docs.scroll.io",
                icon: Book,
                external: true
              },
              {
                title: "SDK Documentation",
                description: "Complete ScrollOne SDK v1.0.0 documentation and API reference",
                href: "#",
                icon: Code,
                external: false
              },
              {
                title: "Bridge Integration Guide",
                description: "Complete guide to integrating with ScrollOne Bridge API v1.0.0",
                href: "#",
                icon: Webhook,
                external: false
              },
              {
                title: "GitHub Examples",
                description: "Real-world examples and starter templates",
                href: "#",
                icon: Github,
                external: false
              },
            ].map((resource, index) => (
              <motion.a
                key={index}
                href={resource.href}
                target={resource.external ? "_blank" : undefined}
                rel={resource.external ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="glass rounded-3xl p-8 border border-border-subtle backdrop-blur-xl hover:border-accent-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-scroll rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <resource.icon className="w-6 h-6 text-white" />
                  </div>
                  {resource.external && <ExternalLink className="w-5 h-5 text-text-secondary" />}
                </div>
                <h3 className="text-xl font-bold mb-2 text-text-primary">{resource.title}</h3>
                <p className="text-text-secondary">{resource.description}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass rounded-3xl p-16 border border-border-subtle backdrop-blur-xl"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              Ready to <span className="gradient-text">Build</span>?
            </h2>
            <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
              Join the Scroll One ecosystem and bring your dApp to thousands of users. 
              Built with ScrollOne SDK v1.0.0 - simple, secure, and powerful.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="#get-started"
                className="px-8 py-4 bg-gradient-scroll text-white rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 shadow-2xl shadow-accent-primary/30"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Start Building</span>
                <ArrowRight className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="mailto:dev@scrollone.app"
                className="px-8 py-4 glass border-2 border-border-subtle text-text-primary rounded-2xl font-semibold text-lg flex items-center justify-center space-x-3 hover:border-accent-primary/50 transition-all backdrop-blur-xl"
                whileHover={{ scale: 1.05 }}
              >
                <span>Contact Us</span>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border-subtle py-16 px-4 sm:px-6 lg:px-8 bg-background-secondary/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-accent-primary/30">
                  <Image 
                    src="/logo.png" 
                    alt="Scroll One Logo" 
                    width={40} 
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <span className="text-2xl font-bold gradient-text block">Scroll One</span>
                  <span className="text-[10px] text-text-tertiary font-mono">superapp</span>
                </div>
              </div>
              <p className="text-text-secondary mb-6 leading-relaxed max-w-md">
                Built for the Scroll ecosystem. Experience Web3, reimagined.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-text-primary">Developers</h4>
              <ul className="space-y-3 text-sm text-text-secondary">
                <li><Link href="/developers" className="hover:text-accent-primary transition-colors">Documentation</Link></li>
                <li><a href="https://docs.scroll.io" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">Scroll Docs</a></li>
                <li><a href="#" className="hover:text-accent-primary transition-colors">SDK Reference</a></li>
                <li><a href="#" className="hover:text-accent-primary transition-colors">Examples</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-text-primary">Resources</h4>
              <ul className="space-y-3 text-sm text-text-secondary">
                <li><Link href="/#features" className="hover:text-accent-primary transition-colors">Features</Link></li>
                <li><Link href="/#ecosystem" className="hover:text-accent-primary transition-colors">Ecosystem</Link></li>
                <li><Link href="/#download" className="hover:text-accent-primary transition-colors">Download</Link></li>
                <li><a href="https://scroll.io" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">Scroll Network</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border-subtle pt-8 text-center text-sm text-text-tertiary">
            <p>&copy; {new Date().getFullYear()} Scroll One SuperApp. Built on Scroll blockchain.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
