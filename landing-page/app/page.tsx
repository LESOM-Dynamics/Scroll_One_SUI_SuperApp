"use client";

import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { 
  Wallet, 
  Shield, 
  Zap, 
  Globe, 
  Smartphone, 
  Lock,
  ArrowRight,
  Check,
  Star,
  Download,
  Apple,
  Play,
  Package,
  Sparkles,
  Users,
  TrendingUp,
  Award,
  ChevronRight,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
  Code,
  Layers,
  Rocket,
  Infinity,
  Cpu,
  Network,
  Fingerprint
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 700 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    setMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-background-primary text-text-primary overflow-x-hidden relative">
      {/* Custom Cursor Effect */}
      <motion.div
        className="fixed w-6 h-6 rounded-full bg-accent-primary/20 pointer-events-none z-[9999] mix-blend-difference"
        style={{ x, y }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      />

      {/* Unique Animated Background with Grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(229,231,235,0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(229,231,235,0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        
        {/* Floating Orbs */}
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
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-primary/5 rounded-full blur-[150px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: 9999, ease: "linear" }}
        />
      </div>

      {/* Navigation with Personality */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-background-primary/80 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <motion.div 
                className="w-10 h-10 bg-gradient-scroll rounded-xl flex items-center justify-center shadow-lg shadow-accent-primary/30 relative overflow-hidden"
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <Zap className="w-6 h-6 text-white relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-accent-primary to-accent-secondary opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.div>
              <div>
                <span className="text-2xl font-bold gradient-text block">Scroll One</span>
                <span className="text-[10px] text-text-tertiary font-mono">superapp</span>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center space-x-8"
            >
              <a href="#features" className="text-text-secondary hover:text-accent-primary transition-colors font-medium text-sm relative group">
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#ecosystem" className="text-text-secondary hover:text-accent-primary transition-colors font-medium text-sm relative group">
                Ecosystem
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="/developers" className="text-text-secondary hover:text-accent-primary transition-colors font-medium text-sm relative group">
                Developers
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#download" className="text-text-secondary hover:text-accent-primary transition-colors font-medium text-sm relative group">
                Download
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary group-hover:w-full transition-all duration-300"></span>
              </a>
              <motion.a
                href="#download"
                className="px-6 py-2.5 bg-gradient-scroll text-white rounded-lg font-semibold text-sm relative overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">Get Started</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-accent-secondary to-accent-primary"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            </motion.div>

            <button
              className="md:hidden text-text-primary relative z-10"
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
              <a href="#features" className="text-text-secondary hover:text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#ecosystem" className="text-text-secondary hover:text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Ecosystem</a>
              <a href="/developers" className="text-text-secondary hover:text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Developers</a>
              <a href="#download" className="text-text-secondary hover:text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Download</a>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section - Unique Asymmetric Layout */}
      <section ref={heroRef} className="relative pt-40 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-accent-primary/30 text-accent-primary text-xs font-semibold mb-8 backdrop-blur-xl"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="w-3 h-3" />
                <span>Now Live on iOS & Android</span>
                <motion.div
                  className="w-2 h-2 rounded-full bg-accent-primary"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: 9999 }}
                />
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.95] tracking-tight"
              >
                <span className="block">One app.</span>
                <span className="block gradient-text">Infinite</span>
                <span className="block">possibilities.</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-text-secondary mb-10 leading-relaxed max-w-xl"
              >
                The Scroll ecosystem, reimagined. Wallet, identity, and 20+ mini-apps in one beautifully crafted experience.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 mb-16"
              >
                <motion.a
                  href="#download"
                  className="group px-8 py-4 bg-gradient-scroll text-white rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 shadow-2xl shadow-accent-primary/30 relative overflow-hidden"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10">Start Exploring</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-accent-secondary to-accent-primary"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
                <motion.a
                  href="#features"
                  className="px-8 py-4 glass border-2 border-border-subtle text-text-primary rounded-2xl font-semibold text-lg flex items-center justify-center space-x-3 hover:border-accent-primary/50 transition-all backdrop-blur-xl"
                  whileHover={{ scale: 1.05 }}
                >
                  <span>See How It Works</span>
                  <ChevronRight className="w-5 h-5" />
                </motion.a>
              </motion.div>

              {/* Stats - Creative Layout */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap gap-6"
              >
                {[
                  { number: "20+", label: "Mini-Apps", icon: Layers },
                  { number: "10K+", label: "Users", icon: Users },
                  { number: "∞", label: "Possibilities", icon: Infinity },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="flex items-center gap-3 glass rounded-xl px-4 py-3 border border-border-subtle backdrop-blur-xl"
                  >
                    <stat.icon className="w-5 h-5 text-accent-primary" />
                    <div>
                      <div className="text-2xl font-bold gradient-text">{stat.number}</div>
                      <div className="text-xs text-text-tertiary">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Side - Smartphone Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:flex items-center justify-center"
            >
              <div className="relative w-full max-w-md">
                {/* Phone Frame */}
                <motion.div
                  className="relative mx-auto"
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {/* Phone Outer Frame with Shadow */}
                  <div className="relative">
                    {/* Phone Bezel */}
                    <div className="bg-gradient-to-b from-gray-900 to-black rounded-[3rem] p-2 shadow-2xl">
                      {/* Phone Screen Border */}
                      <div className="bg-black rounded-[2.5rem] p-1">
                        {/* Notch */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
                        
                        {/* Screen Content */}
                        <div className="relative bg-gradient-to-br from-background-primary via-background-secondary to-background-primary rounded-[2.4rem] overflow-hidden aspect-[9/19.5]">
                          {/* Status Bar */}
                          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/50 to-transparent z-20 flex items-center justify-between px-6 pt-2">
                            <div className="text-white text-xs font-semibold">9:41</div>
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-2 border border-white/50 rounded-sm"></div>
                              <div className="w-1 h-1 bg-white rounded-full"></div>
                            </div>
                          </div>
                          
                          {/* App Screenshot Content */}
                          <div className="absolute inset-0 pt-12 pb-4 px-2">
                            {/* Mock App Interface */}
                            <div className="h-full bg-gradient-to-b from-background-primary to-background-secondary rounded-2xl overflow-hidden relative">
                              {/* Header with gradient */}
                              <div className="h-20 bg-gradient-scroll rounded-t-2xl flex items-center justify-center">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-6 h-6 text-white" />
                                  <span className="text-white font-bold text-lg">Scroll One</span>
                                </div>
                              </div>
                              
                              {/* Tab Navigation */}
                              <div className="flex items-center justify-around bg-background-tertiary/50 border-b border-border-subtle px-4 py-2">
                                {['Wallet', 'Explore', 'Identity'].map((tab, i) => (
                                  <div key={i} className={`text-xs ${i === 1 ? 'text-accent-primary font-semibold' : 'text-text-secondary'}`}>
                                    {tab}
                                  </div>
                                ))}
                              </div>
                              
                              {/* Main Content Area */}
                              <div className="p-4 space-y-3">
                                {/* Balance Card */}
                                <div className="glass rounded-xl p-4 border border-border-subtle backdrop-blur-xl">
                                  <div className="text-text-tertiary text-xs mb-1">Total Balance</div>
                                  <div className="text-2xl font-bold text-text-primary">$0.00</div>
                                  <div className="text-accent-primary text-xs mt-1">0.0 ETH</div>
                                </div>
                                
                                {/* Quick Actions */}
                                <div className="grid grid-cols-4 gap-2">
                                  {[
                                    { icon: ArrowRight, label: 'Send' },
                                    { icon: Download, label: 'Receive' },
                                    { icon: Zap, label: 'Swap' },
                                    { icon: Globe, label: 'Explore' },
                                  ].map((action, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                      <div className="w-12 h-12 bg-gradient-scroll/20 rounded-xl flex items-center justify-center">
                                        <action.icon className="w-5 h-5 text-accent-primary" />
                                      </div>
                                      <span className="text-xs text-text-secondary">{action.label}</span>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Mini Apps Grid */}
                                <div className="grid grid-cols-3 gap-2 mt-4">
                                  {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="aspect-square glass rounded-lg border border-border-subtle flex items-center justify-center">
                                      <div className="text-2xl">🎯</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-scroll/20 rounded-[3rem] blur-2xl -z-10"></div>
                  </div>
                </motion.div>
                
                {/* Floating Decorative Elements */}
                <motion.div
                  className="absolute -top-10 -right-10 w-20 h-20 bg-accent-primary/10 rounded-full blur-xl"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    y: [0, -10, 0]
                  }}
                  transition={{ duration: 4, repeat: 9999, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute -bottom-10 -left-10 w-24 h-24 bg-accent-primary/10 rounded-full blur-xl"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    y: [0, 10, 0]
                  }}
                  transition={{ duration: 5, repeat: 9999, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features - Unique Card Design */}
      <section id="features" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">FEATURES</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent-primary/20"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Built for <span className="gradient-text">builders</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl">
              Every feature crafted with intention. No bloat, just power.
            </p>
          </motion.div>

          <div className="space-y-8">
            {[
              {
                icon: Wallet,
                title: "Your Wallet, Your Rules",
                description: "Full control over your assets. Send, receive, swap—all with the security you deserve.",
                features: ["Multi-token support", "Real-time balance", "Transaction history", "QR codes"],
                color: "from-blue-500 to-cyan-500",
                position: "left"
              },
              {
                icon: Fingerprint,
                title: "Identity You Own",
                description: "Scroll ID isn't just a username. It's your reputation, your achievements, your digital self.",
                features: ["Unique Scroll ID", "Reputation system", "Portable identity", "Badges & achievements"],
                color: "from-purple-500 to-pink-500",
                position: "right"
              },
              {
                icon: Layers,
                title: "20+ Apps, One Home",
                description: "DeFi, NFTs, gaming, social—discover the Scroll ecosystem without leaving the app.",
                features: ["20+ mini-apps", "Category filtering", "Featured apps", "One-click access"],
                color: "from-green-500 to-emerald-500",
                position: "left"
              },
              {
                icon: Rocket,
                title: "Lightning Fast",
                description: "Built on Scroll. Instant transactions, minimal fees, maximum speed.",
                features: ["Instant transactions", "Low fees", "Scalable network", "Optimized performance"],
                color: "from-yellow-500 to-orange-500",
                position: "right"
              },
              {
                icon: Lock,
                title: "Security First",
                description: "Bank-level encryption. Your keys stay on your device. Always.",
                features: ["Encrypted storage", "Biometric auth", "Secure transactions", "Multi-sig support"],
                color: "from-red-500 to-rose-500",
                position: "left"
              },
              {
                icon: Network,
                title: "Everywhere You Are",
                description: "iOS, Android, Web. Your data, your way, on every device.",
                features: ["iOS & Android", "Web support", "Cloud sync", "Seamless experience"],
                color: "from-indigo-500 to-blue-500",
                position: "right"
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: feature.position === "left" ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex flex-col ${feature.position === "right" ? "md:flex-row-reverse" : "md:flex-row"} gap-8 items-center group`}
              >
                <div className="flex-1">
                  <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-text-primary">{feature.title}</h3>
                  <p className="text-text-secondary mb-6 text-lg leading-relaxed">{feature.description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {feature.features.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary"></div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 glass rounded-3xl p-12 border border-border-subtle backdrop-blur-xl h-full flex items-center justify-center group-hover:border-accent-primary/30 transition-all">
                  <div className="text-6xl opacity-20 group-hover:opacity-40 transition-opacity text-text-primary">0{index + 1}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem - Creative Grid */}
      <section id="ecosystem" className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-background-secondary/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20 text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-accent-primary"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">ECOSYSTEM</span>
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              The <span className="gradient-text">Scroll</span> Universe
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Everything you need, all in one place
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "DeFi", emoji: "💎" },
              { name: "NFTs", emoji: "🖼️" },
              { name: "Gaming", emoji: "🎮" },
              { name: "Social", emoji: "👥" },
              { name: "Governance", emoji: "🗳️" },
              { name: "AI", emoji: "🤖" },
              { name: "Payments", emoji: "💳" },
              { name: "Bridge", emoji: "🌉" },
              { name: "Entertainment", emoji: "🎬" },
              { name: "Education", emoji: "📚" },
              { name: "Health", emoji: "🏥" },
              { name: "Fitness", emoji: "💪" },
            ].map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="glass rounded-2xl p-6 text-center border border-border-subtle hover:border-accent-primary/30 transition-all backdrop-blur-xl group cursor-pointer relative overflow-hidden"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={false}
                />
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform relative z-10">{category.emoji}</div>
                <div className="text-text-primary font-semibold relative z-10">{category.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Download - Creative Layout */}
      <section id="download" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20 text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-accent-primary"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">DOWNLOAD</span>
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              Ready to <span className="gradient-text">explore</span>?
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Pick your platform and dive in
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {[
              {
                platform: "iOS",
                icon: Apple,
                href: "https://apps.apple.com/app/scroll-one-superapp",
                gradient: "from-gray-800 to-gray-900",
                description: "App Store"
              },
              {
                platform: "Android",
                icon: Play,
                href: "https://play.google.com/store/apps/details?id=app.rork.scroll_one_superapp",
                gradient: "from-green-600 to-green-700",
                description: "Google Play"
              },
              {
                platform: "APK",
                icon: Package,
                href: "/downloads/scroll-one-superapp.apk",
                gradient: "from-scroll to-scroll-dark",
                description: "Direct Download"
              },
            ].map((item, index) => (
              <motion.a
                key={index}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                download={item.platform === "APK"}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group relative glass rounded-3xl p-10 text-center border border-border-subtle hover:border-accent-primary/50 transition-all backdrop-blur-xl overflow-hidden"
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-20 transition-opacity`}
                />
                <motion.div
                  className={`w-20 h-20 bg-gradient-to-br ${item.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-2xl relative z-10`}
                >
                  <item.icon className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2 text-text-primary relative z-10">{item.platform}</h3>
                <p className="text-text-secondary mb-6 relative z-10">{item.description}</p>
                <div className="flex items-center justify-center space-x-2 text-accent-primary font-semibold relative z-10">
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                </div>
              </motion.a>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 glass rounded-full px-6 py-3 border border-border-subtle backdrop-blur-xl">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent-primary text-accent-primary" />
                ))}
              </div>
              <span className="text-text-secondary font-semibold text-sm">4.8/5 from 10,000+ users</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About - Minimalist */}
      <section id="about" className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-background-secondary/50 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-accent-primary"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">ABOUT</span>
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-12">
              Built for the <span className="gradient-text">future</span>
            </h2>
            <p className="text-xl md:text-2xl text-text-primary leading-relaxed mb-16">
              Scroll One isn't just another app. It's a complete reimagining of what a super app can be. 
              We've taken the best of blockchain technology, wrapped it in beautiful design, and made it 
              accessible to everyone.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass rounded-3xl p-10 border border-border-subtle backdrop-blur-xl"
              >
                <Award className="w-12 h-12 text-accent-primary mb-4" />
                <h3 className="text-2xl font-bold mb-4 text-text-primary">Mission</h3>
                <p className="text-text-secondary leading-relaxed">
                  Make Web3 accessible. No jargon, no complexity—just powerful tools that work.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass rounded-3xl p-10 border border-border-subtle backdrop-blur-xl"
              >
                <TrendingUp className="w-12 h-12 text-accent-primary mb-4" />
                <h3 className="text-2xl font-bold mb-4 text-text-primary">Vision</h3>
                <p className="text-text-secondary leading-relaxed">
                  Become the home for everything Scroll. One app, infinite possibilities.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Minimalist */}
      <footer className="relative border-t border-border-subtle py-16 px-4 sm:px-6 lg:px-8 bg-background-secondary/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-scroll rounded-xl flex items-center justify-center shadow-lg shadow-accent-primary/30">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold gradient-text block">Scroll One</span>
                  <span className="text-[10px] text-text-tertiary font-mono">superapp</span>
                </div>
              </div>
              <p className="text-text-secondary mb-6 leading-relaxed max-w-md">
                Your gateway to the Scroll ecosystem. Experience Web3, reimagined.
              </p>
              <div className="flex items-center space-x-4">
                {[
                  { icon: Twitter, href: "#" },
                  { icon: Github, href: "#" },
                  { icon: Linkedin, href: "#" },
                ].map((social, i) => (
                  <motion.a
                    key={i}
                    href={social.href}
                    className="w-10 h-10 glass rounded-lg flex items-center justify-center hover:bg-accent-primary/20 transition-colors border border-border-subtle"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <social.icon className="w-5 h-5 text-text-secondary" />
                  </motion.a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-text-primary">Product</h4>
              <ul className="space-y-3 text-sm text-text-secondary">
                <li><a href="#features" className="hover:text-accent-primary transition-colors">Features</a></li>
                <li><a href="#ecosystem" className="hover:text-accent-primary transition-colors">Ecosystem</a></li>
                <li><a href="#download" className="hover:text-accent-primary transition-colors">Download</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-text-primary">Developers</h4>
              <ul className="space-y-3 text-sm text-text-secondary">
                <li><a href="/developers" className="hover:text-accent-primary transition-colors">Developer Docs</a></li>
                <li><a href="https://docs.scroll.io" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">Scroll Docs</a></li>
                <li><a href="https://scroll.io" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">Scroll Network</a></li>
                <li><a href="#" className="hover:text-accent-primary transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border-subtle pt-8 text-center text-sm text-text-tertiary">
            <p>&copy; {new Date().getFullYear()} Scroll One SuperApp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
