"use client";

import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";
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
  Fingerprint,
  MessageSquare,
  HelpCircle,
  Mail,
  PlayCircle,
  Quote,
  Minus,
  Plus
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Team from "@/components/ui/team";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [typedText, setTypedText] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
  const textToType = "Super";
  const typingDelay = 150; // milliseconds between each character when typing
  const deleteDelay = 100; // milliseconds between each character when deleting (faster)
  const startDelay = 1000; // initial delay before starting
  const pauseAfterComplete = 2000; // pause after typing completes (2 seconds)
  const pauseBeforeRestart = 500; // pause before restarting after deletion (0.5 seconds)
  
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

  // Typing effect for "Super" - loops continuously with backspace
  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    let intervalId: NodeJS.Timeout | null = null;
    
    const deleteBackward = () => {
      const deleteNextChar = () => {
        if (currentIndex > 0) {
          currentIndex--;
          setTypedText(textToType.slice(0, currentIndex));
          intervalId = setTimeout(deleteNextChar, deleteDelay);
        } else {
          // Deletion complete, wait then restart typing
          timeoutId = setTimeout(() => {
            startTyping();
          }, pauseBeforeRestart);
        }
      };
      
      deleteNextChar();
    };
    
    const startTyping = () => {
      currentIndex = 0;
      
      const typeNextChar = () => {
        if (currentIndex < textToType.length) {
          currentIndex++;
          setTypedText(textToType.slice(0, currentIndex));
          intervalId = setTimeout(typeNextChar, typingDelay);
        } else {
          // Typing complete, wait then start deleting backward
          timeoutId = setTimeout(() => {
            deleteBackward();
          }, pauseAfterComplete);
        }
      };
      
      typeNextChar();
    };
    
    // Initial delay before first typing starts
    timeoutId = setTimeout(() => {
      startTyping();
    }, startDelay);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearTimeout(intervalId);
    };
  }, []);

  if (!mounted) return null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://scrollone.app';
  
  // JSON-LD Structured Data for SEO
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Scroll One SuperApp",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "A comprehensive super app ecosystem built on the Sui blockchain",
    "sameAs": [
      "https://twitter.com/scrollone",
      "https://github.com/scrollone",
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "support@scrollone.app",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Scroll One SuperApp",
    "url": siteUrl,
    "description": "Your Gateway to the Sui Ecosystem",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Scroll One SuperApp",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "iOS, Android, Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250",
    },
    "description": "A comprehensive super app ecosystem built on the Sui blockchain, integrating wallet, identity, and a diverse mini-app marketplace powered by Sui Move and parallel execution.",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl,
      },
    ],
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
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
              <a href="#demo" className="text-text-secondary hover:text-accent-primary transition-colors font-medium text-sm relative group">
                Demo
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#sui" className="text-text-secondary hover:text-accent-primary transition-colors font-medium text-sm relative group">
                Why Sui
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
              <a href="#about" className="text-text-secondary hover:text-accent-primary transition-colors font-medium text-sm relative group">
                About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#faq" className="text-text-secondary hover:text-accent-primary transition-colors font-medium text-sm relative group">
                FAQ
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary group-hover:w-full transition-all duration-300"></span>
              </a>
              <motion.div
                className="px-6 py-2.5 bg-background-secondary/50 text-text-secondary rounded-lg font-semibold text-sm relative overflow-hidden group border border-border-subtle cursor-not-allowed"
                title="Launching Soon - We're putting on the final touches"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>Launching Soon</span>
                  <Sparkles className="w-3 h-3 text-accent-primary" />
                </span>
              </motion.div>
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
              <a href="#sui" className="text-text-secondary hover:text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Why Sui</a>
              <a href="#demo" className="text-text-secondary hover:text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Demo</a>
              <a href="#ecosystem" className="text-text-secondary hover:text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Ecosystem</a>
              <a href="/developers" className="text-text-secondary hover:text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Developers</a>
              <a href="#about" className="text-text-secondary hover:text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>About</a>
              <a href="#faq" className="text-text-secondary hover:text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
              <a href="#download" className="text-text-secondary hover:text-accent-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Coming Soon</a>
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
                <span>Launching Soon</span>
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
                <span className="block">
                  One{" "}
                  <span className="gradient-text inline-block">
                    {typedText}
                    {typedText.length < textToType.length && (
                      <motion.span
                        key="cursor"
                        animate={{ 
                          opacity: [1, 1, 0, 0]
                        }}
                        transition={{ 
                          duration: 1,
                          times: [0, 0.5, 0.5, 1],
                          repeat: 9999,
                          ease: "linear"
                        }}
                        className="inline-block ml-1"
                      >
                        |
                      </motion.span>
                    )}
                  </span>
                  App
                </span>
                <span className="block gradient-text">Infinite</span>
                <span className="block">possibilities.</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-text-secondary mb-10 leading-relaxed max-w-xl"
              >
                The Sui ecosystem, reimagined. Scroll One brings wallet, identity, and 20+ mini-apps together in one experience—built on Sui, not the Scroll blockchain.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 mb-16"
              >
                <motion.div
                  className="group px-8 py-4 bg-background-secondary/50 text-text-secondary rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 shadow-lg border border-border-subtle relative overflow-hidden cursor-not-allowed"
                  title="Early Access Opening Soon - We're in final development"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>Early Access Opening Soon</span>
                    <Sparkles className="w-4 h-4 text-accent-primary" />
                  </span>
                </motion.div>
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
                        <div className="relative bg-black rounded-[2.4rem] overflow-hidden aspect-[9/19.5]">
                          {/* App Screenshot */}
                          <Image
                            src="/app-screenshot.png"
                            alt="Scroll One SuperApp Screenshot"
                            fill
                            className="object-cover object-top rounded-[2.4rem]"
                            priority
                            quality={90}
                          />
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
                description: "Full control over your SUI and on-chain objects. Send, receive, and swap assets secured by Sui&apos;s object ownership model.",
                features: ["SUI & token support", "Object-based assets", "Transaction history", "QR codes"],
                color: "from-blue-500 to-cyan-500",
                position: "left"
              },
              {
                icon: Fingerprint,
                title: "Identity You Own",
                description: "Scroll ID isn&apos;t just a username. It&apos;s your reputation, your achievements, your portable digital self across the Sui network.",
                features: ["Unique Scroll ID", "Reputation system", "Portable identity", "Badges & achievements"],
                color: "from-purple-500 to-pink-500",
                position: "right"
              },
              {
                icon: Layers,
                title: "20+ Apps, One Home",
                description: "DeFi, NFTs, gaming, social—discover Sui-native dApps built with Sui Move without leaving the app.",
                features: ["20+ mini-apps", "Category filtering", "Featured apps", "One-click access"],
                color: "from-green-500 to-emerald-500",
                position: "left"
              },
              {
                icon: Rocket,
                title: "Lightning Fast",
                description: "Built on Sui. Parallel transaction execution and sub-second finality for simple transfers—no global consensus bottleneck.",
                features: ["Parallel execution", "Fast-path transfers", "Low gas fees", "Horizontal scale"],
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

      {/* Powered by Sui */}
      <section id="sui" className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-background-secondary/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="mb-20 text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-accent-primary"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">POWERED BY SUI</span>
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              Built on <span className="gradient-text">Sui</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Sui is a Layer 1 blockchain designed for high-performance decentralized apps. Its object-centric data model enables parallel execution, low-latency finality, and horizontal scalability.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Cpu,
                title: "Object-Centric Model",
                description: "Every asset on Sui is a programmable object with a unique on-chain ID—owned, shared, or immutable. Transactions interact directly with objects, not a global account ledger.",
              },
              {
                icon: Zap,
                title: "Parallel Execution",
                description: "Owned-object transfers bypass global consensus via Byzantine Consistent Broadcast, achieving sub-second finality. Independent transaction flows run in parallel without blocking each other.",
              },
              {
                icon: Code,
                title: "Sui Move",
                description: "Smart contracts are written in Sui Move—an asset-centric, type-safe dialect of Move originally developed at Meta. Strong ownership types make bugs and exploits far less likely.",
              },
              {
                icon: Network,
                title: "Scale Without Limits",
                description: "Shared-object transactions are ordered through the Bullshark consensus protocol. Low-cost on-chain storage lets dApps keep rich data directly on-chain for full composability.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-3xl p-8 border border-border-subtle backdrop-blur-xl hover:border-accent-primary/30 transition-all"
              >
                <item.icon className="w-10 h-10 text-accent-primary mb-4" />
                <h3 className="text-xl font-bold mb-3 text-text-primary">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section id="demo" className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-8 text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-accent-primary"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">WATCH DEMO</span>
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              See It in <span className="gradient-text">Action</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Watch how Scroll One SuperApp transforms your Web3 experience on Sui
            </p>
          </motion.div>

          <ContainerScroll
            titleComponent={
              <>
              </>
            }
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <iframe
                width="560"
                height="315"
                src="https://www.youtube.com/embed/BTva_cgqkRI?si=n0auRf3gngqAakFR"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-full h-full max-w-4xl aspect-video rounded-2xl"
              />
            </div>
          </ContainerScroll>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-background-secondary/50 to-transparent">
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
              <span className="text-accent-primary font-mono text-sm tracking-wider">TESTIMONIALS</span>
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              ( will be ) Loved by <span className="gradient-text">Users</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              See what our community is saying about Scroll One SuperApp
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Alex Chen",
                role: "DeFi Trader",
                avatar: "👤",
                rating: 5,
                text: "Scroll One SuperApp changed how I interact with DeFi on Sui. Having everything in one app is a game-changer. The wallet integration is seamless!",
                verified: true
              },
              {
                name: "Sarah Martinez",
                role: "NFT Collector",
                avatar: "👤",
                rating: 5,
                text: "I love exploring new mini-apps without leaving the app. The identity system is brilliant - my reputation follows me everywhere.",
                verified: true
              },
              {
                name: "James Wilson",
                role: "Web3 Developer",
                avatar: "👤",
                rating: 5,
                text: "As a developer, the SDK is incredibly well-documented. I integrated my dApp in under an hour. The team really knows what they&apos;re doing.",
                verified: true
              },
              {
                name: "Emma Thompson",
                role: "Crypto Enthusiast",
                avatar: "👤",
                rating: 5,
                text: "Finally, a super app that doesn't compromise on security. My keys stay on my device, and the UI is beautiful. This is the future!",
                verified: true
              },
              {
                name: "Michael Brown",
                role: "Gaming Enthusiast",
                avatar: "👤",
                rating: 5,
                text: "The gaming mini-apps are amazing! I can play, earn, and trade all from one place. Sui&apos;s parallel execution makes everything feel instant.",
                verified: true
              },
              {
                name: "Lisa Anderson",
                role: "Social Trader",
                avatar: "👤",
                rating: 5,
                text: "The social features combined with trading capabilities make this the perfect app for me. Community is everything in Web3!",
                verified: true
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-3xl p-8 border border-border-subtle backdrop-blur-xl hover:border-accent-primary/30 transition-all group"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent-primary text-accent-primary" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-accent-primary/30 mb-4" />
                <p className="text-text-secondary mb-6 leading-relaxed">{testimonial.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-scroll rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-text-primary">{testimonial.name}</h4>
                      {testimonial.verified && (
                        <div className="w-4 h-4 bg-accent-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-text-tertiary">{testimonial.role}</p>
                  </div>
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
              The <span className="gradient-text">Sui</span> Universe
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Everything you need on Sui&apos;s object-centric Layer 1—all in one place
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
              Almost <span className="gradient-text">here</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-4">
              We're putting on the final touches
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-accent-primary/30 text-accent-primary text-sm font-semibold mb-6 backdrop-blur-xl">
              <Sparkles className="w-4 h-4" />
              <span>Currently in active development</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {[
              {
                platform: "iOS",
                icon: Apple,
                gradient: "from-gray-800 to-gray-900",
                description: "App Store",
                status: "Coming Soon"
              },
              {
                platform: "Android",
                icon: Play,
                gradient: "from-green-600 to-green-700",
                description: "Google Play",
                status: "Coming Soon"
              },
              {
                platform: "APK",
                icon: Package,
                gradient: "from-scroll to-scroll-dark",
                description: "Direct Download",
                status: "Coming Soon"
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative glass rounded-3xl p-10 text-center border border-border-subtle backdrop-blur-xl overflow-hidden cursor-not-allowed opacity-75"
                title={`${item.platform} - ${item.status}`}
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-5`}
                />
                <motion.div
                  className={`w-20 h-20 bg-gradient-to-br ${item.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl relative z-10 opacity-60`}
                >
                  <item.icon className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2 text-text-primary relative z-10">{item.platform}</h3>
                <p className="text-text-secondary mb-4 relative z-10">{item.description}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background-secondary/50 border border-border-subtle mb-4 relative z-10">
                  <span className="text-xs font-semibold text-text-tertiary">{item.status}</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-text-tertiary font-semibold relative z-10">
                  <Download className="w-5 h-5" />
                  <span>Unavailable</span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center gap-3 glass rounded-full px-6 py-3 border border-accent-primary/30 backdrop-blur-xl">
              <Sparkles className="w-4 h-4 text-accent-primary" />
              <span className="text-text-secondary font-semibold text-sm">Join the waitlist to be notified when we launch</span>
            </div>
            <p className="text-text-tertiary text-sm max-w-md mx-auto">
              We're working hard to deliver the best experience. Sign up for our newsletter to get early access.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16 text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-accent-primary"></div>
              <span className="text-accent-primary font-mono text-sm tracking-wider">FAQ</span>
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              Common <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Everything you need to know about Scroll One SuperApp
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                question: "What is Scroll One SuperApp?",
                answer: "Scroll One SuperApp is a comprehensive super app built on the Sui blockchain—not the Scroll L2 network. It combines a secure crypto wallet, decentralized identity management, and an extensive marketplace of 20+ mini-applications. It's your all-in-one gateway to the Sui ecosystem, leveraging Sui's object-centric model, Sui Move smart contracts, and parallel transaction execution."
              },
              {
                question: "Is Scroll One related to the Scroll blockchain?",
                answer: "No. Despite the name, Scroll One is not affiliated with or built on the Scroll blockchain (scroll.io). Scroll One is a super app powered exclusively by the Sui network. The name reflects our vision of scrolling through a unified Web3 experience—not any connection to Scroll L2."
              },
              {
                question: "Is Scroll One SuperApp free to use?",
                answer: "Yes! Scroll One SuperApp will be completely free to download and use once it launches. You'll only pay network gas fees for on-chain transactions, which are typically very low on Sui. There are no subscription fees or hidden costs. We're currently in active development and putting on the final touches before launch."
              },
              {
                question: "How secure is my wallet?",
                answer: "Security is our top priority. Your private keys are encrypted and stored locally on your device using your device's secure keychain. We never have access to your keys, and all transactions require your explicit approval. We also support biometric authentication for added security."
              },
              {
                question: "What is Scroll ID?",
                answer: "Scroll ID is your decentralized identity on the Sui network. It's a unique identifier that you own and control, complete with a reputation system, badges, and achievements. Your Scroll ID is portable and can be used across different applications in the Sui ecosystem."
              },
              {
                question: "Can I use my existing wallet?",
                answer: "Yes! You can import your existing Sui wallet using your recovery phrase. Scroll One SuperApp supports standard Sui wallets, so you can bring your existing SUI and on-chain objects and continue using them seamlessly."
              },
              {
                question: "What mini-apps are available?",
                answer: "Scroll One SuperApp features 20+ mini-apps across categories including DeFi (trading, lending, swapping), NFTs (marketplaces, galleries), Gaming, Social networking, Governance, AI tools, and more. New Sui-native apps are added regularly based on community feedback."
              },
              {
                question: "Is Scroll One SuperApp available on all platforms?",
                answer: "Scroll One SuperApp will be available on iOS, Android, and Web when we launch. Your data will sync across all platforms, so you can access your wallet and identity from any device. The experience will be consistent across all platforms. We're currently in final development and will announce launch dates soon."
              },
              {
                question: "How do I integrate my dApp?",
                answer: "We provide a comprehensive SDK and bridge API for developers building on Sui Move. Check out our Developers page for documentation, code examples, and integration guides. The process is straightforward and well-documented."
              },
              {
                question: "Why is Scroll One built on Sui?",
                answer: "Scroll One is built on Sui—not the Scroll L2 blockchain. Sui is a high-performance Layer 1 designed for scale. Unlike account-based blockchains, Sui stores every asset as a programmable object with a unique on-chain ID. Simple transfers of owned objects bypass global consensus and finalize in sub-seconds, while complex interactions use the Bullshark consensus protocol. Sui Move—a safe, asset-centric dialect of Move—powers the smart contracts behind our mini-app ecosystem."
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-2xl border border-border-subtle backdrop-blur-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-background-secondary/50 transition-colors"
                >
                  <h3 className="text-lg font-bold text-text-primary pr-4">{faq.question}</h3>
                  <motion.div
                    animate={{ rotate: openFAQ === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    {openFAQ === index ? (
                      <Minus className="w-5 h-5 text-accent-primary" />
                    ) : (
                      <Plus className="w-5 h-5 text-text-secondary" />
                    )}
                  </motion.div>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFAQ === index ? "auto" : 0,
                    opacity: openFAQ === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 text-text-secondary leading-relaxed">
                    {faq.answer}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section id="newsletter" className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-background-secondary/50 to-transparent">
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
              <span className="text-accent-primary font-mono text-sm tracking-wider">NEWSLETTER</span>
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              Be the <span className="gradient-text">First</span>
            </h2>
            <p className="text-xl text-text-secondary mb-4 max-w-2xl mx-auto">
              Get notified when we launch and receive early access
            </p>
            <p className="text-sm text-text-tertiary mb-10 max-w-2xl mx-auto">
              Join our waitlist to be among the first to experience Scroll One SuperApp
            </p>

            {!emailSubmitted ? (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  // Here you would integrate with your email service (e.g., Mailchimp, ConvertKit, etc.)
                  setEmailSubmitted(true);
                  setEmail("");
                }}
                className="glass rounded-3xl p-8 border border-border-subtle backdrop-blur-xl max-w-2xl mx-auto"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="flex-1 px-6 py-4 bg-background-secondary border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary transition-colors"
                  />
                  <motion.button
                    type="submit"
                    className="px-8 py-4 bg-gradient-scroll text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-accent-primary/30 hover:shadow-accent-primary/50 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>Subscribe</span>
                    <Mail className="w-5 h-5" />
                  </motion.button>
                </div>
                <p className="text-xs text-text-tertiary mt-4 text-center">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </motion.form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-3xl p-8 border border-accent-primary/30 backdrop-blur-xl max-w-2xl mx-auto"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-scroll rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary">Thanks for subscribing!</h3>
                  <p className="text-text-secondary text-center">
                    Check your email to confirm your subscription. We&apos;ll keep you updated with the latest from Scroll One SuperApp.
                  </p>
                  <button
                    onClick={() => setEmailSubmitted(false)}
                    className="text-accent-primary hover:text-accent-secondary transition-colors text-sm"
                  >
                    Subscribe another email
                  </button>
                </div>
              </motion.div>
            )}
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
              Scroll One SuperApp isn&apos;t just another app. It&apos;s a complete reimagining of what a super app can be on Sui. 
              We&apos;ve taken Sui&apos;s object-centric architecture, parallel execution, and Sui Move smart contracts, wrapped them in beautiful design, and made Web3 accessible to everyone.
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
                  Become the home for everything on Sui. One app, infinite possibilities—not affiliated with the Scroll blockchain.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-background-secondary/50 to-transparent">
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
              <span className="text-accent-primary font-mono text-sm tracking-wider">TEAM</span>
              <div className="h-px w-20 bg-gradient-to-r from-accent-primary to-transparent"></div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              Meet the <span className="gradient-text">Team</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              The passionate people behind Scroll One SuperApp
            </p>
          </motion.div>

          <Team />
        </div>
      </section>

      {/* Footer - Minimalist */}
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
                Your gateway to the Sui ecosystem. Experience Web3, reimagined on Sui.
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
                <li><a href="#download" className="hover:text-accent-primary transition-colors">Coming Soon</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-text-primary">Developers</h4>
              <ul className="space-y-3 text-sm text-text-secondary">
                <li><a href="/developers" className="hover:text-accent-primary transition-colors">Developer Docs</a></li>
                <li><a href="https://docs.sui.io" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">Sui Docs</a></li>
                <li><a href="https://sui.io" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">Sui Network</a></li>
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
    </>
  );
}
