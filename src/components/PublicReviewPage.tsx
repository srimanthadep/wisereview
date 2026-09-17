import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../supabase";
import { Business, FragmentSet } from "../types";
import { generateReview } from "../lib/generator";
import confetti from "canvas-confetti";
import { Skeleton } from "./Skeleton";
import { 
  Star, 
  Sparkles, 
  Check, 
  Copy, 
  RefreshCw, 
  AlertCircle, 
  ShieldCheck, 
  ExternalLink,
  Sun,
  Moon
} from "lucide-react";
import wiseReviewLogo from "../assets/images/logo.png";

interface PublicReviewPageProps {
  slug: string;
  onNavigateHome: () => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export default function PublicReviewPage({ slug, onNavigateHome, theme, toggleTheme }: PublicReviewPageProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [fragmentSet, setFragmentSet] = useState<FragmentSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [generatedReview, setGeneratedReview] = useState("");
  const [copied, setCopied] = useState(false);
  const [pastReviews, setPastReviews] = useState<string[]>([]);

  // Load Business & Fragment Set on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // Fire all 3 queries in parallel for faster load
        const [busResult, fragResult, evResult] = await Promise.all([
          supabase.from("businesses").select("*").eq("slug", slug).maybeSingle(),
          supabase.from("fragment_sets").select("*").eq("business_id", slug).maybeSingle(),
          supabase.from("scan_events").select("user_agent").eq("business_id", slug),
        ]);

        if (busResult.error) throw busResult.error;

        if (busResult.data) {
          const business = { ...busResult.data, id: busResult.data.slug } as Business;
          setBusiness(business);

          if (fragResult.error) throw fragResult.error;

          if (fragResult.data) {
            const fragmentData = { ...fragResult.data, id: fragResult.data.business_id } as FragmentSet;
            setFragmentSet(fragmentData);

            // Parse past reviews from scan events
            const parsedPastReviews: string[] = [];
            if (evResult.data) {
              evResult.data.forEach((e: any) => {
                if (e.user_agent && e.user_agent.includes(" | review:")) {
                  const parts = e.user_agent.split(" | review:");
                  if (parts.length > 1) {
                    parsedPastReviews.push(parts[1].trim());
                  }
                }
              });
            }
            setPastReviews(parsedPastReviews);

            // Generate first review
            const firstReview = generateReview(business, fragmentData, parsedPastReviews);
            setGeneratedReview(firstReview);
            setPastReviews((prev) => [...prev, firstReview]);

            // Fire-and-forget: LOG FUNNEL LANDING EVENT
            supabase.from("scan_events").insert({
              business_id: slug,
              owner_id: business.owner_id,
              scanned_at: new Date().toISOString(),
              redirected_to_google: false,
              user_agent: `${navigator.userAgent} | review:${firstReview}`,
            }).then(() => {});
          } else {
            setError("Template vocabulary set not found.");
          }
        } else {
          setError("Business profile not found.");
        }
      } catch (err) {
        console.error("Error loading public review page", err);
        setError("Failed to initialize review generator. Check network connectivity.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  // Regenerate Review
  const handleRegenerate = () => {
    if (business && fragmentSet) {
      const nextReview = generateReview(business, fragmentSet, pastReviews);
      setGeneratedReview(nextReview);
      setPastReviews((prev) => [...prev, nextReview]);
      setCopied(false);

      // Fire-and-forget: log to DB in the background
      supabase.from("scan_events").insert({
        business_id: slug,
        owner_id: business.owner_id,
        scanned_at: new Date().toISOString(),
        redirected_to_google: false,
        user_agent: `${navigator.userAgent} | review:${nextReview}`,
      }).then(() => {});
    }
  };

  // Copy & Post to Google Reviews Page
  const handleCopyAndPost = async () => {
    if (!business) return;

    try {
      // 1. Copy generated review to clipboard
      await navigator.clipboard.writeText(generatedReview);
      setCopied(true);

      // 2. Trigger colorful confetti explosion!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      // 3. LOG REDIRECT EVENT (redirected_to_google = true)
      await supabase.from("scan_events").insert({
        business_id: slug,
        owner_id: business.owner_id,
        scanned_at: new Date().toISOString(),
        redirected_to_google: true,
        user_agent: `${navigator.userAgent} | review:${generatedReview}`,
      });

      // 4. Redirect to Google Review Write submission page in new tab
      setTimeout(() => {
        const googleUrl = `https://search.google.com/local/writereview?placeid=${business.google_place_id}`;
        window.open(googleUrl, "_blank");
        setCopied(false);
      }, 1000);

    } catch (err) {
      console.error("Error in Copy & Post flow", err);
      alert("Failed to copy. Please copy the review draft manually.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 select-none">
        <div className="w-full max-w-[420px] bg-white border border-slate-100 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.06)] rounded-[32px] p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-9 h-9 rounded-xl bg-slate-200/80" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-28 bg-slate-200/80" />
                <Skeleton className="h-2.5 w-20 bg-slate-200/60" />
              </div>
            </div>
            <Skeleton className="h-4 w-20 rounded-full bg-slate-200/70" />
          </div>
          {/* Stars */}
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-6 h-6 rounded bg-slate-200/70" />
            ))}
          </div>
          {/* Review block */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3 min-h-[140px]">
            <Skeleton className="h-3.5 w-full bg-slate-200/70" />
            <Skeleton className="h-3.5 w-11/12 bg-slate-200/70" />
            <Skeleton className="h-3.5 w-10/12 bg-slate-200/70" />
            <Skeleton className="h-3.5 w-3/4 bg-slate-200/70" />
          </div>
          {/* Buttons */}
          <div className="space-y-3.5">
            <Skeleton className="h-14 rounded-2xl bg-slate-200/80" />
            <Skeleton className="h-12 rounded-2xl bg-slate-200/50" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 text-center select-none font-sans">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-white">Oops! Something went wrong</h3>
        <p className="text-sm text-slate-400 font-light max-w-sm mt-1">{error || "The link you followed is invalid."}</p>
        <button 
          onClick={onNavigateHome}
          className="mt-6 px-6 py-3 bg-slate-900 border border-slate-800 text-sm text-slate-200 rounded-xl cursor-pointer"
        >
          Return to WiseReview Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 relative select-none font-sans overflow-hidden">
      
      {/* Glow Orbs */}
      <div className="absolute top-10 left-10 w-[40vw] h-[40vw] bg-teal-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[40vw] h-[40vw] bg-cyan-600/[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="w-full max-w-[420px] bg-white border border-slate-100 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.06)] rounded-[32px] p-6 sm:p-8 relative flex flex-col justify-between"
      >
        
        {/* Header Section */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Star className="w-5 h-5 fill-teal-500 text-teal-500" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">{business.name}</h1>
              <span className="text-[10px] text-slate-400 font-light block">
                {business.area}, {business.city}
              </span>
            </div>
          </div>
          <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold uppercase tracking-wider">
            Verified Profile
          </span>
        </div>

        {/* Five Star rating simulator */}
        <div className="text-center space-y-1 mb-6">
          <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            Your Suggested Review Draft
          </p>
          <div className="flex justify-center gap-1.5 pt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-6 h-6 text-amber-400 fill-amber-400 cursor-pointer hover:scale-110 transition-transform" />
            ))}
          </div>
        </div>

        {/* Display generated combinatorial text */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] relative flex-1 min-h-[140px] flex flex-col justify-between mb-6">
          <p className="text-sm sm:text-[14.5px] leading-relaxed text-slate-700 font-medium italic">
            "{generatedReview}"
          </p>
          <div className="flex items-center justify-between border-t border-slate-100/80 pt-4 mt-4 text-[10px] font-mono text-slate-400">
            <span>Length: {generatedReview.length} / 280 limits</span>
            <span>Combinatorial Generation</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3.5">
          
          {/* Copy & Post (Confetti, redirect) */}
          <button 
            onClick={handleCopyAndPost}
            className={`w-full py-4 text-sm font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-lg ${
              copied 
                ? "bg-emerald-500 text-white shadow-emerald-500/10" 
                : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:opacity-95 shadow-teal-500/20"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" /> Copied Draft Successfully!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" /> Copy & Post to Google <ExternalLink className="w-4 h-4 opacity-75" />
              </>
            )}
          </button>

          {/* Regenerate draft */}
          <button 
            onClick={handleRegenerate}
            className="w-full py-3.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-extrabold text-teal-600 rounded-2xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tap to Generate Different Draft
          </button>

        </div>

        {/* Secured badge at bottom of phone card */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-center">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-light uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-slate-400" /> Powered & Verified by WiseReview
          </div>
        </div>

      </motion.div>

      {/* Brand logo capsule under the card */}
      <div className="mt-6 flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verified Local SEO Partner</span>
        <img 
          src={wiseReviewLogo} 
          alt="WiseReview Logo" 
          className="h-8 w-auto object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
