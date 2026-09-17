import React, { useState } from "react";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Star,
  ArrowRight,
  Check,
  Copy,
  Sparkles,
  TrendingUp,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Menu,
  Sun,
  Moon,
  QrCode,
  MousePointerClick,
  BarChart3,
  Quote,
  Repeat,
  Search,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";
import wiseReviewLogo from "../assets/images/logo.png";
import smartCareLogo from "../assets/images/smartcare.png";

interface LandingPageProps {
  theme: "dark" | "light";
  toggleTheme: () => void;
  onNavigateToDashboard: () => void;
}

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it Works" },
  { href: "#why-reviews", label: "Why Reviews" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

// Official multi-color Google "G" mark
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

export default function LandingPage({ theme, toggleTheme, onNavigateToDashboard }: LandingPageProps) {
  // Interactive Phone Mockup review generator demo state
  const demoHighlights = [
    {
      tag: "⚡ Fast Setup",
      reviewer: "Rahul M.",
      badge: "Local Guide · 42 reviews",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=faces&q=80",
      review:
        "We migrated our sales pipeline to SmartClient in less than a day. The platform is incredibly intuitive, lead response is 3x faster, and our team closed 25% more deals this month!",
    },
    {
      tag: "🤝 24/7 Support",
      reviewer: "Priya S.",
      badge: "Local Guide · 18 reviews",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=faces&q=80",
      review:
        "Hands down the most reliable CRM on the market. SmartClient simplifies contacts, email tracking, and automation. World-class customer support team that replies in under 2 minutes!",
    },
    {
      tag: "📈 3x Growth",
      reviewer: "Marcus T.",
      badge: "Verified Client · 31 reviews",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=faces&q=80",
      review:
        "SmartClient is a total game-changer for scaling client retention. The automated follow-ups save our team 15+ hours weekly, and quarterly revenues reached an all-time record high.",
    },
  ];

  const [activeHighlightIdx, setActiveHighlightIdx] = useState(0);
  const [demoCopied, setDemoCopied] = useState(false);
  const [demoRating, setDemoRating] = useState(5);
  const [phoneTilt, setPhoneTilt] = useState({ x: 0, y: 0 });
  const [isRegenerating, setIsRegenerating] = useState(false);

  const currentHighlight = demoHighlights[activeHighlightIdx];

  const handleSelectHighlight = (idx: number) => {
    setActiveHighlightIdx(idx);
    setDemoCopied(false);
  };

  const handleRegenerateDemo = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setActiveHighlightIdx((prev) => (prev + 1) % demoHighlights.length);
      setIsRegenerating(false);
      setDemoCopied(false);
    }, 180);
  };

  const handleCopyDemo = async () => {
    try {
      await navigator.clipboard.writeText(currentHighlight.review);
      setDemoCopied(true);
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.65 },
        colors: ["#14b8a6", "#38bdf8", "#fbbf24", "#34d399", "#a855f7"],
      });

      setTimeout(() => {
        setDemoCopied(false);
      }, 2200);
    } catch (error) {
      console.error("Clipboard copy failed:", error);
    }
  };

  // 3D Tilt Effect for Phone Mockup
  const handleMouseMovePhone = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    const tiltX = (y / (box.height / 2)) * -12;
    const tiltY = (x / (box.width / 2)) * 12;
    setPhoneTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeavePhone = () => setPhoneTilt({ x: 0, y: 0 });

  // Spotlight effect for pricing cards
  const [spotlight1, setSpotlight1] = useState({ x: 0, y: 0 });
  const [spotlight2, setSpotlight2] = useState({ x: 0, y: 0 });
  const handleSpotlight = (e: React.MouseEvent<HTMLDivElement>, id: 1 | 2) => {
    const box = e.currentTarget.getBoundingClientRect();
    const pos = { x: e.clientX - box.left, y: e.clientY - box.top };
    if (id === 1) setSpotlight1(pos);
    else setSpotlight2(pos);
  };

  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.5 },
  };

  return (
    <div
      id="landing-page"
      className={`flex flex-col min-h-screen text-[#e5e5e5] relative font-sans selection:bg-teal-500 selection:text-black overflow-x-hidden ${
        theme === "light" ? "bg-[#edeceb]" : "bg-transparent"
      }`}
    >
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px] animate-[pulse_10s_infinite_alternate]" />
        <div className="absolute top-[25%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] animate-[pulse_12s_infinite_alternate_2s]" />
        <div className="absolute bottom-[-5%] left-[20%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[130px] animate-[pulse_8s_infinite_alternate]" />
      </div>

      {/* =========================
           TOP RIGHT THEME SWITCH & UTILITIES
           ========================= */}
      <div className="cd-top-right-bar" aria-label="Website utilities">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="cd-utility-btn" aria-label="Sign In">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <button
          onClick={toggleTheme}
          className="cd-theme-switch-btn"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="cd-theme-switch-label">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-teal-600" />
              <span className="cd-theme-switch-label">Dark</span>
            </>
          )}
        </button>
      </div>

      {/* =========================
           FLOATING PILL NAVBAR (CoolDock Style)
           ========================= */}
      <header className="cd-site-header">
        <div className="cd-nav-shell">
          {/* BRAND */}
          <a
            className="cd-brand"
            href="#hero-section"
            aria-label="WiseReview home"
          >
            <img
              src="/logo_without_text.png"
              alt="WiseReview"
              className="cd-app-logo"
              decoding="async"
            />
            <span className="cd-brand-text font-rosemary">WiseReview</span>
          </a>

          {/* DESKTOP NAVIGATION */}
          <nav
            className="cd-nav-desktop"
            aria-label="Primary navigation"
          >
            <ul>
              <li>
                <a href="#how-it-works">How it Works</a>
              </li>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <a href="#why-reviews">Why Reviews</a>
              </li>
            </ul>
          </nav>

          {/* ACTION BUTTON & MOBILE CONTROLS */}
          <div className="flex items-center gap-2">
            <SignedOut>
              <SignUpButton mode="modal">
                <button
                  className="cd-button cd-button--primary cd-button--small cd-nav-download"
                  aria-label="Get Started Free"
                >
                  <span>Get Started</span>
                  <ArrowRight className="cd-button__icon" />
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <button
                onClick={onNavigateToDashboard}
                className="cd-button cd-button--primary cd-button--small cd-nav-download"
                aria-label="Dashboard"
              >
                <span>Dashboard</span>
                <ArrowRight className="cd-button__icon" />
              </button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 rounded-full ring-1 ring-black/20 hover:ring-black/50 transition-all",
                  },
                }}
              />
            </SignedIn>

            {/* MOBILE MENU */}
            <details className="cd-nav-mobile" data-cd-menu="">
              <summary aria-label="Open navigation menu">
                <Menu className="w-5 h-5 text-black" />
              </summary>
              <div className="cd-nav-mobile__panel">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-black/10">
                  <img
                    src="/logo_without_text.png"
                    alt="WiseReview"
                    className="cd-app-logo h-6 w-auto"
                  />
                  <span className="font-rosemary font-bold text-base text-black">WiseReview</span>
                </div>
                <nav aria-label="Mobile navigation">
                  <ul>
                    <li>
                      <a href="#how-it-works">How it Works</a>
                    </li>
                    <li>
                      <a href="#features">Features</a>
                    </li>
                    <li>
                      <a href="#pricing">Pricing</a>
                    </li>
                    <li>
                      <a href="#why-reviews">Why Reviews</a>
                    </li>
                  </ul>
                </nav>
                <div className="pt-2 border-t border-black/10 flex items-center justify-between">
                  <button
                    onClick={toggleTheme}
                    className="p-1.5 rounded-lg border border-black/10 bg-black/5 text-black hover:bg-black/10 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-teal-600" />}
                    <span>{theme === "dark" ? "Light" : "Dark"}</span>
                  </button>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="text-xs font-semibold text-black/70 hover:text-black cursor-pointer">
                        Sign In
                      </button>
                    </SignInButton>
                  </SignedOut>
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main className="flex-grow relative z-10">
        {/* ============ HERO ============ */}
        <section id="hero-section" className="relative pt-16 sm:pt-20 pb-10 sm:pb-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center pt-2 sm:pt-4">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="lg:col-span-7 space-y-6 sm:space-y-7"
              >

                {/* Minimalist Premium Headline */}
                <h1 className="font-display text-5xl sm:text-6xl lg:text-[70px] xl:text-[78px] font-black tracking-[-0.035em] text-white leading-[1.08]">
                  Get{" "}
                  <span className="font-rosemary-hero font-bold italic inline-block tracking-normal text-[1.14em] px-1">
                    Wise
                  </span>
                  . <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-teal-200 via-cyan-100 to-white bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
                    Get{" "}
                    <span className="font-rosemary-hero font-bold italic inline-block tracking-normal text-[1.14em] px-1">
                      Reviews
                    </span>
                    .
                  </span>
                </h1>

                {/* Refined Description */}
                <p className="font-body text-base sm:text-lg text-white/80 max-w-xl font-normal leading-relaxed tracking-[-0.01em]">
                  WiseReview turns a quick QR scan into an authentic, on-brand Google review your customers post in a single tap. More reviews, higher local rankings, zero friction.
                </p>

                {/* Premium CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                  <SignedIn>
                    <button
                      onClick={onNavigateToDashboard}
                      className="hero-primary-btn group relative px-7 py-3.5 text-[15px] font-bold text-[#081738] bg-white hover:bg-slate-100 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.8)_inset] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer font-body"
                    >
                      <span>Go to Dashboard</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  </SignedIn>
                  <SignedOut>
                    <SignUpButton mode="modal">
                      <button className="hero-primary-btn group relative px-7 py-3.5 text-[15px] font-bold text-[#081738] bg-white hover:bg-slate-100 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.8)_inset] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer font-body">
                        <span>Get Started Free</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </button>
                    </SignUpButton>
                  </SignedOut>
                  <a
                    href="#how-it-works"
                    className="px-6 py-3.5 text-[15px] font-semibold text-white/90 hover:text-white bg-black/15 hover:bg-black/25 border border-white/20 hover:border-white/35 rounded-xl transition-all duration-200 backdrop-blur-md flex items-center justify-center gap-2 font-body hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
                  >
                    <span>See how it works</span>
                  </a>
                </div>

                {/* Minimalist Trust Features */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/75 font-medium font-body pt-0.5">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-300 stroke-[2.5]" />
                    Free forever
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-300 stroke-[2.5]" />
                    No credit card required
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-300 stroke-[2.5]" />
                    2-min setup
                  </span>
                </div>


                {/* Minimal Frosted Glass Metric Cards */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-white/15">
                  {[
                    {
                      stat: "1-Tap",
                      label: "Google Post",
                      desc: "Direct to review dialog",
                      icon: Zap,
                      glow: "from-teal-400/20 to-transparent",
                      badge: "text-teal-300",
                    },
                    {
                      stat: "100%",
                      label: "Authentic AI",
                      desc: "Zero repetitive text",
                      icon: ShieldCheck,
                      glow: "from-emerald-400/20 to-transparent",
                      badge: "text-emerald-300",
                    },
                    {
                      stat: "220ch",
                      label: "SEO-Optimized",
                      desc: "Top local rank signals",
                      icon: TrendingUp,
                      glow: "from-cyan-400/20 to-transparent",
                      badge: "text-cyan-300",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="relative group overflow-hidden rounded-2xl bg-black/15 hover:bg-black/25 border border-white/15 hover:border-white/25 p-3.5 sm:p-4 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${item.glow} rounded-full blur-xl pointer-events-none`} />
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                          {item.stat}
                        </span>
                        <item.icon className={`w-4 h-4 ${item.badge}`} />
                      </div>
                      <div className="font-display text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white/90">
                        {item.label}
                      </div>
                      <div className="font-body text-[11px] text-white/60 font-light hidden sm:block mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right Interactive 3D Phone Mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="lg:col-span-5 flex justify-center lg:justify-end relative lg:-translate-x-3 xl:-translate-x-4"
              >
                <div className="relative" style={{ perspective: "1600px" }}>
                  {/* Ambient glow behind device */}
                  <div className="absolute inset-0 -m-10 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.18),rgba(37,99,235,0.06)_45%,transparent_70%)] blur-[45px] rounded-[80px] pointer-events-none" />
                  {/* Device (tilts on hover) */}
                  <div
                    onMouseMove={handleMouseMovePhone}
                    onMouseLeave={handleMouseLeavePhone}
                    style={{
                      transform: `rotateX(${phoneTilt.x}deg) rotateY(${phoneTilt.y}deg)`,
                      transition: "transform 0.15s ease-out",
                      willChange: "transform",
                    }}
                    className="relative w-[280px] sm:w-[295px] aspect-[1046/2159] select-none filter drop-shadow-[0_45px_75px_rgba(0,0,0,0.85)]"
                  >
                    {/* Screen Content (fits precisely inside the PSD screen mask) */}
                    <div
                      style={{
                        position: "absolute",
                        left: "3.54%",
                        top: "1.39%",
                        width: "92.83%",
                        height: "97.18%",
                      }}
                      className="rounded-[38px] sm:rounded-[40px] overflow-hidden flex flex-col justify-between bg-[#07090e] z-10 mockup-preserve-dark relative font-sans select-none"
                    >
                      {/* Ambient background wallpaper glow */}
                      <div className="absolute inset-0 bg-[radial-gradient(130%_65%_at_50%_0%,rgba(20,184,166,0.18),rgba(37,99,235,0.06)_50%,transparent_75%)] pointer-events-none" />
                      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

                      {/* Top Bar: iOS Status Bar + Business Header */}
                      <div className="relative z-10">
                        {/* Status bar */}
                        <div className="flex justify-between items-center px-5 pt-3 pb-1">
                          <span className="text-[10px] font-bold text-white/90 tracking-tight">9:41</span>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-end gap-[2px]">
                              {[3, 5, 7, 9].map((h, i) => (
                                <div key={i} style={{ height: `${h}px` }} className="w-[2.5px] rounded-sm bg-white/80" />
                              ))}
                            </div>
                            <svg width="11" height="9" viewBox="0 0 10 8" className="text-white/80 fill-current">
                              <path d="M5 6.5a1 1 0 110 2 1 1 0 010-2zm0-2.5C6.38 4 7.63 4.56 8.54 5.46l.71-.71C8.2 3.69 6.7 3 5 3s-3.2.69-4.25 1.75l.71.71C2.37 4.56 3.62 4 5 4zm0-2.5c1.93 0 3.68.78 4.95 2.05l.71-.71A8.96 8.96 0 005 0 8.96 8.96 0 00.34 2.34l.71.71A6.47 6.47 0 015 1z" />
                            </svg>
                            <div className="flex items-center gap-[1px]">
                              <div className="w-[18px] h-[9px] border border-white/40 rounded-[3px] flex items-center px-[1px]">
                                <div className="w-[13px] h-[5px] bg-emerald-400 rounded-[1.5px]" />
                              </div>
                              <div className="w-[1.5px] h-[4px] bg-white/30 rounded-r-sm" />
                            </div>
                          </div>
                        </div>

                        {/* Verified Business Card */}
                        <div className="px-3.5 pt-2">
                          <div className="flex items-center justify-between rounded-2xl bg-white/[0.06] border border-white/10 p-2.5 shadow-sm backdrop-blur-md">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500/30 to-cyan-600/20 border border-teal-400/30 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-[0_0_12px_rgba(20,184,166,0.3)]">
                                <img src={smartCareLogo} alt="SmartClient" className="w-5 h-5 object-contain" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[12px] font-bold text-white leading-none truncate">SmartClient</span>
                                  <ShieldCheck className="w-3 h-3 text-teal-400 flex-shrink-0" />
                                </div>
                                <div className="flex items-center gap-1 text-[8.5px] text-white/50 font-medium mt-1">
                                  <span>Google Verified</span>
                                  <span>·</span>
                                  <span className="text-amber-300 font-semibold flex items-center gap-0.5">
                                    ★ 4.9 <span className="text-white/40 font-normal">(128)</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <GoogleG className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>

                        {/* Experience sentiment topic selector */}
                        <div className="px-3.5 pt-2.5 pb-1">
                          <div className="flex items-center justify-between px-1 mb-1.5">
                            <span className="text-[8px] font-bold text-teal-300 uppercase tracking-wider">Select Experience Highlight</span>
                            <span className="text-[7.5px] text-white/40 font-mono">Tap chip</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {demoHighlights.map((item, idx) => (
                              <button
                                key={item.tag}
                                onClick={() => handleSelectHighlight(idx)}
                                className={`flex-1 py-1 px-1.5 rounded-lg text-[8px] font-bold tracking-tight transition-all duration-150 cursor-pointer text-center truncate ${
                                  activeHighlightIdx === idx
                                    ? "bg-teal-400/20 border border-teal-400/50 text-teal-200 shadow-[0_0_12px_rgba(20,184,166,0.25)]"
                                    : "bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.08]"
                                }`}
                              >
                                {item.tag}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Star Rating Simulator */}
                        <div className="px-3.5 pt-1.5 text-center">
                          <div className="inline-flex items-center gap-1 p-1 px-2.5 rounded-full bg-black/25 border border-white/10 backdrop-blur-md">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                onClick={() => setDemoRating(s)}
                                className="cursor-pointer transition-transform hover:scale-125 active:scale-95"
                                title={`Rate ${s} stars`}
                              >
                                <Star
                                  className={`w-3.5 h-3.5 transition-colors ${
                                    s <= demoRating
                                      ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]"
                                      : "text-white/20 fill-white/10"
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-[8px] font-bold text-amber-300 ml-1">
                              {demoRating}.0
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Main Center AI Review Card */}
                      <div className="mx-3.5 my-1.5 flex-1 flex flex-col relative z-10">
                        <div className="flex-1 flex flex-col justify-between rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-white/[0.02] backdrop-blur-md p-3 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                          {/* Reviewer identity & AI Badge */}
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={currentHighlight.avatar}
                                alt={currentHighlight.reviewer}
                                className="w-6 h-6 rounded-full object-cover ring-1 ring-white/30 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-[9.5px] font-bold text-white leading-none truncate">
                                  {currentHighlight.reviewer}
                                </div>
                                <div className="text-[7.5px] text-white/40 font-medium mt-0.5 flex items-center gap-1">
                                  <span>{currentHighlight.badge}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/25 text-emerald-300 text-[7px] font-bold uppercase tracking-wider flex-shrink-0">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                              <span>AI Generated</span>
                            </div>
                          </div>

                          {/* Dynamic Review Text */}
                          <div className="relative py-2 flex-1 flex items-center">
                            <AnimatePresence mode="wait">
                              <motion.p
                                key={activeHighlightIdx}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.18 }}
                                className="text-[9.5px] leading-[1.65] font-normal text-white/90"
                              >
                                "{currentHighlight.review}"
                              </motion.p>
                            </AnimatePresence>
                          </div>

                          {/* Card Footer Metadata */}
                          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[7px] font-mono text-white/45">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-2 h-2 text-teal-400" />
                              <span>{currentHighlight.review.length} / 280 chars</span>
                            </span>
                            <span className="text-teal-300 font-semibold flex items-center gap-1">
                              <Check className="w-2 h-2 text-teal-300" />
                              <span>100% Unique</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Controls & Footer */}
                      <div className="px-3.5 pb-3.5 space-y-2 relative z-10">
                        {/* Secondary Button: Regenerate */}
                        <button
                          onClick={handleRegenerateDemo}
                          className="w-full py-2 bg-white/[0.05] hover:bg-white/[0.1] active:scale-[0.98] border border-white/10 hover:border-white/20 text-white/75 hover:text-white font-bold rounded-xl text-[8.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 text-teal-300 ${isRegenerating ? "animate-spin" : ""}`} />
                          <span>Generate Different Draft</span>
                        </button>

                        {/* Primary Button: Copy & Post */}
                        <button
                          onClick={handleCopyDemo}
                          className={`w-full py-2.5 text-[9.5px] uppercase tracking-wider font-black rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.97] cursor-pointer shadow-lg ${
                            demoCopied
                              ? "bg-emerald-500 text-white shadow-[0_6px_24px_rgba(16,185,129,0.5)]"
                              : "bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 shadow-[0_8px_25px_rgba(20,184,166,0.45)]"
                          }`}
                        >
                          {demoCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Copied! Opening Google Reviews...</span>
                            </>
                          ) : (
                            <>
                              <GoogleG className="w-3.5 h-3.5" />
                              <span>Copy &amp; Post to Google</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70 ml-0.5" />
                            </>
                          )}
                        </button>

                        {/* iOS Home Indicator Pill */}
                        <div className="pt-1 flex flex-col items-center gap-1">
                          <span className="text-[6.5px] text-white/30 font-medium uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck className="w-2 h-2 text-teal-400/60" /> Powered by WiseReview
                          </span>
                          <div className="w-20 h-1 rounded-full bg-white/30" />
                        </div>
                      </div>
                    </div>

                    {/* Authentic iPhone 16 Mockup Frame from PSD */}
                    <img
                      src="/iphone_16_frame.webp"
                      alt="iPhone 16 Mockup"
                      className="pointer-events-none absolute inset-0 z-30 w-full h-full object-contain select-none"
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Trust bar */}
            <div className="mt-8 sm:mt-12 pt-6 border-t border-white/10">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">
                Built for every kind of local business
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-white/40">
                {["Dental Clinics", "Salons & Spas", "Restaurants", "Gyms & Fitness", "Retail Stores", "Local Services"].map((b) => (
                  <span key={b} className="text-sm sm:text-base font-bold tracking-tight hover:text-white/70 transition-colors">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section id="how-it-works" className="py-12 sm:py-16 relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 space-y-3">
              <span className="text-xs font-semibold tracking-widest text-teal-400 uppercase">How it works</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                From scan to 5-star review in seconds
              </h2>
              <p className="text-white/60 font-light text-base md:text-lg">
                No apps to install, no accounts for your customers. Just a QR code and one tap.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* connecting line */}
              <div className="hidden md:block absolute top-[52px] left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              {[
                { n: "01", icon: <QrCode className="w-6 h-6" />, title: "Customer scans your QR", desc: "Place your unique QR code on receipts, table stands, or desk cards. A quick scan opens your branded review page." },
                { n: "02", icon: <Sparkles className="w-6 h-6" />, title: "We generate a unique draft", desc: "Our combinatorial engine writes a natural, on-brand review referencing your services, staff, and neighborhood." },
                { n: "03", icon: <MousePointerClick className="w-6 h-6" />, title: "They post to Google in one tap", desc: "Copy & Post drops them straight into Google's review box with the draft ready. Done in seconds." },
              ].map((step) => (
                <motion.div
                  key={step.n}
                  {...fadeUp}
                  className="relative bg-white/5 border border-white/10 rounded-3xl p-7 hover:border-teal-400/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-blue-600/10 border border-teal-400/20 flex items-center justify-center text-teal-400 mb-5">
                    {step.icon}
                  </div>
                  <span className="text-xs font-mono font-bold text-white/30 tracking-widest">{step.n}</span>
                  <h3 className="text-lg font-bold text-white mt-1.5 mb-2">{step.title}</h3>
                  <p className="text-sm text-white/50 font-light leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ WHY REVIEWS ============ */}
        <section id="why-reviews" className="py-12 sm:py-16 relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-10 space-y-3">
              <span className="text-xs font-semibold tracking-widest text-teal-400 uppercase">The physics of local SEO</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Reviews are Google's favorite ranking signal
              </h2>
              <p className="text-white/60 font-light text-base md:text-lg">
                Google Maps and Search lean on customer reviews to gauge relevance, freshness, and authority. The numbers make the case.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { stat: "16–20%", label: "of local ranking weight comes from review signals", icon: <TrendingUp className="w-4 h-4" /> },
                { stat: "88%", label: "of consumers trust online reviews as much as personal recommendations", icon: <ShieldCheck className="w-4 h-4" /> },
                { stat: "3.4×", label: "more likely customers choose a business with recent, frequent reviews", icon: <Star className="w-4 h-4" /> },
                { stat: "76%", label: "of local searches result in a visit or purchase within 24 hours", icon: <Zap className="w-4 h-4" /> },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  {...fadeUp}
                  className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between hover:border-teal-400/30 transition-all duration-300 min-h-[200px]"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/15 flex items-center justify-center text-teal-400">
                    {s.icon}
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-extrabold text-white">{s.stat}</div>
                    <p className="text-[13px] text-white/50 font-light leading-relaxed">{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FEATURES ============ */}
        <section id="features" className="py-12 sm:py-16 relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 space-y-3">
              <span className="text-xs font-semibold tracking-widest text-teal-400 uppercase">Features</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Everything you need to grow reviews
              </h2>
              <p className="text-white/60 font-light text-base md:text-lg">
                A complete toolkit for collecting authentic Google reviews and tracking your local growth.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: <Sparkles className="w-5 h-5" />, title: "Combinatorial generation", desc: "Thousands of unique, natural-sounding drafts from your own fragment library — no two reviews alike." },
                { icon: <QrCode className="w-5 h-5" />, title: "Branded QR codes", desc: "High-resolution, printable QR codes ready for receipts, stickers, table tents, and desk cards." },
                { icon: <ShieldCheck className="w-5 h-5" />, title: "Authentic & on-brand", desc: "Drafts reference your real services, staff, area, and city — never generic AI filler." },
                { icon: <BarChart3 className="w-5 h-5" />, title: "Scan & conversion analytics", desc: "Track scans, redirects, conversion rate, and weekly review velocity from one dashboard." },
                { icon: <Repeat className="w-5 h-5" />, title: "Unlimited regeneration", desc: "Customers can reroll drafts until one feels right, then post in a single tap." },
                { icon: <Search className="w-5 h-5" />, title: "Local SEO keywords", desc: "Neighborhood and city tokens woven in to strengthen your Map Pack ranking signals." },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  {...fadeUp}
                  className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-teal-400/30 hover:bg-white/[0.07] transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500/20 to-blue-600/10 border border-teal-400/20 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-105 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-white/50 font-light leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TESTIMONIALS ============ */}
        <section className="py-12 sm:py-16 relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 space-y-3">
              <span className="text-xs font-semibold tracking-widest text-teal-400 uppercase">Loved by owners</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Local businesses are winning with WiseReview
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { quote: "We went from a trickle of reviews to 40+ in our first month. Our clinic now ranks in the top 3 on Maps for our area.", name: "Dr. Ananya Sharma", role: "Sparsh Dental, Mumbai", g: "from-teal-500 to-cyan-600", i: "A" },
                { quote: "Customers actually use it because it's effortless. One scan, one tap, done. The drafts sound like real people, not robots.", name: "Rohan Mehta", role: "The Brew Bar, Pune", g: "from-blue-500 to-indigo-600", i: "R" },
                { quote: "The analytics alone are worth it. I can finally see how many walk-ins turn into Google reviews every week.", name: "Sana Kapoor", role: "Glow Salon & Spa, Delhi", g: "from-fuchsia-500 to-purple-600", i: "S" },
              ].map((t, i) => (
                <motion.div
                  key={i}
                  {...fadeUp}
                  className="bg-white/5 border border-white/10 rounded-3xl p-7 flex flex-col hover:border-white/20 transition-all duration-300"
                >
                  <Quote className="w-7 h-7 text-teal-400/40 mb-4" />
                  <div className="flex gap-0.5 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-[15px] text-white/70 font-light leading-relaxed flex-1">"{t.quote}"</p>
                  <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/10">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.g} flex items-center justify-center text-sm font-bold text-white`}>
                      {t.i}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{t.name}</div>
                      <div className="text-xs text-white/40 font-light">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PRICING ============ */}
        <section id="pricing" className="py-12 sm:py-16 relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 space-y-3">
              <span className="text-xs font-semibold tracking-widest text-teal-400 uppercase">Pricing</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Simple pricing that scales with you
              </h2>
              <p className="text-white/60 font-light text-base md:text-lg">
                Start free forever. Upgrade once for lifetime access — no subscriptions, ever.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Starter */}
              <div
                onMouseMove={(e) => handleSpotlight(e, 1)}
                className="relative overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col"
              >
                <div
                  className="pointer-events-none absolute -inset-px opacity-0 hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(400px circle at ${spotlight1.x}px ${spotlight1.y}px, rgba(20,184,166,0.06), transparent 40%)` }}
                />
                <div className="relative">
                  <h3 className="text-lg font-bold text-white">Free</h3>
                  <p className="text-sm text-white/50 font-light mt-1">For a single location getting started.</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-white">₹0</span>
                    <span className="text-white/40 font-light">/ forever</span>
                  </div>
                  <p className="text-xs text-white/40 font-light mt-1.5">No card required · Free for life</p>
                  <SignedOut>
                    <SignUpButton mode="modal">
                      <button className="w-full mt-6 py-3.5 bg-white/5 border border-white/15 text-white font-bold rounded-xl hover:bg-white/10 transition-all cursor-pointer">
                        Get Started Free
                      </button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <button onClick={onNavigateToDashboard} className="w-full mt-6 py-3.5 bg-white/5 border border-white/15 text-white font-bold rounded-xl hover:bg-white/10 transition-all cursor-pointer">
                      Go to Dashboard
                    </button>
                  </SignedIn>
                  <ul className="mt-8 space-y-3.5">
                    {["1 business profile", "Branded QR code", "5 review scans / month", "Basic scan analytics"].map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-white/70 font-light">
                        <CheckCircle2 className="w-4.5 h-4.5 text-teal-400 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pro */}
              <div
                onMouseMove={(e) => handleSpotlight(e, 2)}
                className="relative overflow-hidden bg-gradient-to-b from-teal-500/[0.08] to-blue-600/[0.04] border border-teal-400/30 rounded-3xl p-8 flex flex-col shadow-lg shadow-teal-500/5"
              >
                <div
                  className="pointer-events-none absolute -inset-px opacity-0 hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(400px circle at ${spotlight2.x}px ${spotlight2.y}px, rgba(20,184,166,0.12), transparent 40%)` }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Pro</h3>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-400/30 font-bold uppercase tracking-wider">
                      Most popular
                    </span>
                  </div>
                  <p className="text-sm text-white/50 font-light mt-1">For growing businesses that want it all.</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-white">₹2,999</span>
                    <span className="text-white/40 font-light">/ lifetime</span>
                  </div>
                  <p className="text-xs text-teal-400/90 font-light mt-1.5">One-time payment · lifetime access</p>
                  <SignedOut>
                    <SignUpButton mode="modal">
                      <button className="w-full mt-6 py-3.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:from-teal-400 hover:to-blue-500 transition-all cursor-pointer flex items-center justify-center gap-2">
                        Get Started <ArrowRight className="w-4 h-4" />
                      </button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <button onClick={onNavigateToDashboard} className="w-full mt-6 py-3.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:from-teal-400 hover:to-blue-500 transition-all cursor-pointer flex items-center justify-center gap-2">
                      Open Dashboard <ArrowRight className="w-4 h-4" />
                    </button>
                  </SignedIn>
                  <ul className="mt-8 space-y-3.5">
                    {["Everything in Free", "Unlimited review scans", "Custom fragment editor", "Full conversion analytics", "Priority support"].map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-white/80 font-light">
                        <CheckCircle2 className="w-4.5 h-4.5 text-teal-400 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 border-t border-white/10 py-8 sm:py-10 text-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo_without_text.png"
                alt="WiseReview"
                className="h-7 w-auto object-contain"
              />
              <span className="font-rosemary font-rosemary-bold font-bold text-2xl text-white tracking-tight">WiseReview</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-medium">
              <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">Login</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">Sign Up</button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <button onClick={onNavigateToDashboard} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">Dashboard</button>
              </SignedIn>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center pt-8 text-xs text-center">
            <p>&copy; {new Date().getFullYear()} WiseReview Inc. All rights reserved. Built to grow organic review signals safely.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
