import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../supabase";
import { UserButton } from "@clerk/clerk-react";
import { Skeleton } from "./Skeleton";
import { Business, FragmentSet, ScanEvent, CATEGORY_LABELS } from "../types";
import { generateReview } from "../lib/generator";
import { QRCodeSVG } from "qrcode.react";
import {
  LayoutDashboard,
  QrCode,
  WandSparkles,
  Settings,
  CreditCard,
  LogOut,
  Sparkles,
  Check,
  Copy,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Download,
  AlertCircle,
  Sun,
  Moon,
  Menu,
  X,
  MousePointerClick,
  Zap,
  ShieldCheck,
  Star,
} from "lucide-react";
import wiseReviewLogo from "../assets/images/logo.png";

const googleGLogo = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>'
);

/** Draws the Google wordmark letter-by-letter on a canvas context. */
function drawGoogleWordmark(ctx: CanvasRenderingContext2D, x: number, y: number, fontSize: number) {
  const letters = [
    { char: "G", color: "#4285F4" },
    { char: "o", color: "#EA4335" },
    { char: "o", color: "#FBBC05" },
    { char: "g", color: "#4285F4" },
    { char: "l", color: "#34A853" },
    { char: "e", color: "#EA4335" },
  ];
  ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  // Calculate total width first
  const totalWidth = letters.reduce((sum, l) => sum + ctx.measureText(l.char).width, 0);
  let curX = x - totalWidth / 2;
  for (const { char, color } of letters) {
    ctx.fillStyle = color;
    ctx.fillText(char, curX, y);
    curX += ctx.measureText(char).width;
  }
}

interface DashboardProps {
  businessSlug: string;
  onLogout: () => void;
  onNavigateToPublic: (slug: string) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

type TabType = "overview" | "qr" | "fragments" | "settings" | "billing";

const NAV_ITEMS: { key: TabType; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "qr", label: "QR Code", icon: QrCode },
  { key: "fragments", label: "Fragments", icon: WandSparkles },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "billing", label: "Billing", icon: CreditCard },
];

const PAGE_META: Record<TabType, { title: string; sub: string }> = {
  overview: { title: "Overview", sub: "Your local SEO performance at a glance." },
  qr: { title: "QR Code", sub: "Download and share your review funnel." },
  fragments: { title: "Fragment Editor", sub: "Tune the vocabulary that builds your reviews." },
  settings: { title: "Business Settings", sub: "Manage your profile and Google integration." },
  billing: { title: "Billing & Plan", sub: "Manage your subscription and limits." },
};

export default function Dashboard({ businessSlug, onLogout, onNavigateToPublic, theme, toggleTheme }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [fragmentSet, setFragmentSet] = useState<FragmentSet | null>(null);
  const [scanEvents, setScanEvents] = useState<ScanEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pastReviews, setPastReviews] = useState<string[]>([]);

  // States for live preview
  const [previewText, setPreviewText] = useState("");
  const [copied, setCopied] = useState(false);

  // States for fragment editing
  const [activeFragmentCat, setActiveFragmentCat] = useState<keyof Omit<FragmentSet, "id" | "business_id" | "owner_id">>("openings");
  const [newFragmentText, setNewFragmentText] = useState("");

  // States for Settings forms
  const [settingsName, setSettingsName] = useState("");
  const [settingsContact, setSettingsContact] = useState("");
  const [settingsArea, setSettingsArea] = useState("");
  const [settingsCity, setSettingsCity] = useState("");
  const [settingsPlaceId, setSettingsPlaceId] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load Business & Fragments & Scan Events
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fire all 3 queries in parallel for faster load
      const [busResult, fragResult, evResult] = await Promise.all([
        supabase.from("businesses").select("*").eq("slug", businessSlug).maybeSingle(),
        supabase.from("fragment_sets").select("*").eq("business_id", businessSlug).maybeSingle(),
        supabase.from("scan_events").select("*").eq("business_id", businessSlug),
      ]);

      if (busResult.error) throw busResult.error;
      if (fragResult.error) throw fragResult.error;
      if (evResult.error) throw evResult.error;

      // Process scan events & parse past reviews
      const loadedEvents = (evResult.data || []) as ScanEvent[];
      setScanEvents(loadedEvents);

      const parsedReviews: string[] = [];
      loadedEvents.forEach((e) => {
        if (e.user_agent && e.user_agent.includes(" | review:")) {
          const parts = e.user_agent.split(" | review:");
          if (parts.length > 1) {
            parsedReviews.push(parts[1].trim());
          }
        }
      });
      setPastReviews(parsedReviews);

      // Process business
      if (busResult.data) {
        let busData = { ...busResult.data, id: busResult.data.slug } as Business;

        if (busData.plan !== "pro") {
          supabase.from("businesses").update({ plan: "pro" }).eq("slug", businessSlug); // fire-and-forget
          busData = { ...busData, plan: "pro" };
        }

        setBusiness(busData);
        setSettingsName(busData.name);
        setSettingsContact(busData.contact_name);
        setSettingsArea(busData.area);
        setSettingsCity(busData.city);
        setSettingsPlaceId(busData.google_place_id);

        // Process fragments
        if (fragResult.data) {
          const fragData = { ...fragResult.data, id: fragResult.data.business_id } as FragmentSet;
          setFragmentSet(fragData);
          setPreviewText(generateReview(busData, fragData, parsedReviews));
        }
      }
    } catch (e) {
      console.error("Error loading dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [businessSlug]);

  const handleRegeneratePreview = () => {
    if (business && fragmentSet) {
      const nextReview = generateReview(business, fragmentSet, pastReviews);
      setPreviewText(nextReview);
      setPastReviews((prev) => [...prev, nextReview]);
      setCopied(false);

      // Fire-and-forget: log to DB in the background, don't block UI
      supabase
        .from("scan_events")
        .insert({
          business_id: businessSlug,
          owner_id: business.owner_id,
          scanned_at: new Date().toISOString(),
          redirected_to_google: false,
          user_agent: `owner_preview | review:${nextReview}`,
        })
        .then(() => {});
    }
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (!pastReviews.includes(previewText) && business) {
      setPastReviews((prev) => [...prev, previewText]);
      // Fire-and-forget
      supabase
        .from("scan_events")
        .insert({
          business_id: businessSlug,
          owner_id: business.owner_id,
          scanned_at: new Date().toISOString(),
          redirected_to_google: false,
          user_agent: `owner_preview | review:${previewText}`,
        })
        .then(() => {});
    }
  };

  const handleAddFragment = async () => {
    if (!newFragmentText.trim() || !fragmentSet) return;
    try {
      const updatedList = [...(fragmentSet[activeFragmentCat] || []), newFragmentText.trim()];
      const updatedFragmentSet = { ...fragmentSet, [activeFragmentCat]: updatedList };

      const { error } = await supabase
        .from("fragment_sets")
        .update({ [activeFragmentCat]: updatedList })
        .eq("business_id", businessSlug);
      if (error) throw error;

      setFragmentSet(updatedFragmentSet);
      setNewFragmentText("");
      if (business) setPreviewText(generateReview(business, updatedFragmentSet, pastReviews));
    } catch (e) {
      console.error("Error adding fragment", e);
    }
  };

  const handleDeleteFragment = async (indexToDelete: number) => {
    if (!fragmentSet) return;
    try {
      const currentList = fragmentSet[activeFragmentCat] || [];
      const updatedList = currentList.filter((_, idx) => idx !== indexToDelete);
      const updatedFragmentSet = { ...fragmentSet, [activeFragmentCat]: updatedList };

      const { error } = await supabase
        .from("fragment_sets")
        .update({ [activeFragmentCat]: updatedList })
        .eq("business_id", businessSlug);
      if (error) throw error;

      setFragmentSet(updatedFragmentSet);
      if (business) setPreviewText(generateReview(business, updatedFragmentSet, pastReviews));
    } catch (e) {
      console.error("Error deleting fragment", e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setSaveLoading(true);
    setSaveSuccess(false);
    try {
      const updatedBusiness: Partial<Business> = {
        name: settingsName.trim(),
        contact_name: settingsContact.trim(),
        area: settingsArea.trim(),
        city: settingsCity.trim(),
        google_place_id: settingsPlaceId.trim(),
      };
      const finalBusiness = { ...business, ...updatedBusiness } as Business;

      const { error } = await supabase.from("businesses").update(updatedBusiness).eq("slug", businessSlug);
      if (error) throw error;

      setBusiness(finalBusiness);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating business settings", err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Stats
  const clientScanEvents = scanEvents.filter(e => !e.user_agent?.startsWith("owner_preview"));
  const totalScans = clientScanEvents.length;
  const totalRedirects = clientScanEvents.filter((e) => e.redirected_to_google).length;
  const conversionRate = totalScans > 0 ? Math.round((totalRedirects / totalScans) * 100) : 0;

  const getVelocity = () => {
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const nowMs = new Date().getTime();
    let thisWeekCount = 0;
    let lastWeekCount = 0;
    clientScanEvents.forEach((e) => {
      let eventMs = 0;
      if (e.scanned_at && typeof e.scanned_at.toDate === "function") eventMs = e.scanned_at.toDate().getTime();
      else if (e.scanned_at instanceof Date) eventMs = e.scanned_at.getTime();
      else if (typeof e.scanned_at === "string") eventMs = new Date(e.scanned_at).getTime();
      else if (e.scanned_at && e.scanned_at.seconds) eventMs = e.scanned_at.seconds * 1000;
      if (eventMs > 0) {
        const diff = nowMs - eventMs;
        if (diff <= oneWeekMs) thisWeekCount++;
        else if (diff > oneWeekMs && diff <= 2 * oneWeekMs) lastWeekCount++;
      }
    });
    return { thisWeek: thisWeekCount, lastWeek: lastWeekCount };
  };

  const velocity = getVelocity();
  const publicUrl = `${window.location.origin}/r/${businessSlug}`;

  const categoryLabels: Record<string, string> = {
    dental: "Dentist",
    salon: "Salon / Spa",
    restaurant: "Restaurant",
    gym: "Fitness Gym",
    retail: "Retail Store",
    other: "Local Business",
  };

  const handleDownloadQR = () => {
    const svgElement = document.getElementById("qr-svg-code");
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const blobURL = window.URL.createObjectURL(svgBlob);

    const loadImg = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
      });
    };

    Promise.all([
      loadImg(blobURL),
      loadImg(wiseReviewLogo),
      loadImg(googleGLogo)
    ]).then(([qrImage, logoImage, gIconImg]) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 1200;
      const context = canvas.getContext("2d");
      
      if (context) {
        // 1. Draw solid white background card
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Draw card frame border (light blue)
        context.strokeStyle = "#dbeafe"; // blue-100
        context.lineWidth = 14;
        context.beginPath();
        context.roundRect(20, 20, canvas.width - 40, canvas.height - 40, 48);
        context.stroke();

        // 3. Draw Google Wordmark (letter-by-letter in brand colors)
        drawGoogleWordmark(context, canvas.width / 2, 145, 72);

        // 4. Draw Headline
        context.fillStyle = "#374151"; // gray-700
        context.font = "bold 40px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "alphabetic";
        context.fillText("Check us out on", canvas.width / 2, 225);
        context.fillStyle = "#1e40af"; // blue-800
        context.fillText("Google", canvas.width / 2, 280);

        // 5. Draw Google's 4-color border around the QR code
        const borderX = 260;
        const borderY = 320;
        const borderSize = 480;
        const borderWidth = 16;
        const radius = 32;

        // Top-Right Corner / Top side: Red
        context.strokeStyle = "#EA4335";
        context.lineWidth = borderWidth;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(borderX + borderSize / 2, borderY);
        context.lineTo(borderX + borderSize - radius, borderY);
        context.arcTo(borderX + borderSize, borderY, borderX + borderSize, borderY + radius, radius);
        context.lineTo(borderX + borderSize, borderY + borderSize / 2);
        context.stroke();

        // Bottom-Right Corner / Right side: Yellow
        context.strokeStyle = "#FBBC05";
        context.beginPath();
        context.moveTo(borderX + borderSize, borderY + borderSize / 2);
        context.lineTo(borderX + borderSize, borderY + borderSize - radius);
        context.arcTo(borderX + borderSize, borderY + borderSize, borderX + borderSize - radius, borderY + borderSize, radius);
        context.lineTo(borderX + borderSize / 2, borderY + borderSize);
        context.stroke();

        // Bottom-Left Corner / Bottom side: Green
        context.strokeStyle = "#34A853";
        context.beginPath();
        context.moveTo(borderX + borderSize / 2, borderY + borderSize);
        context.lineTo(borderX + radius, borderY + borderSize);
        context.arcTo(borderX, borderY + borderSize, borderX, borderY + borderSize - radius, radius);
        context.lineTo(borderX, borderY + borderSize / 2);
        context.stroke();

        // Top-Left Corner / Left side: Blue
        context.strokeStyle = "#4285F4";
        context.beginPath();
        context.moveTo(borderX, borderY + borderSize / 2);
        context.lineTo(borderX, borderY + radius);
        context.arcTo(borderX, borderY, borderX + radius, borderY, radius);
        context.lineTo(borderX + borderSize / 2, borderY);
        context.stroke();

        // 6. Draw QR code centered inside the border (size 410x410)
        context.drawImage(qrImage, borderX + 35, borderY + 35, 410, 410);

        // 7. Draw white center box (size 100x100) inside the QR code
        const centerSize = 100;
        const centerX = borderX + borderSize / 2 - centerSize / 2;
        const centerY = borderY + borderSize / 2 - centerSize / 2;
        context.fillStyle = "#ffffff";
        context.beginPath();
        context.roundRect(centerX, centerY, centerSize, centerSize, 18);
        context.fill();

        // 8. Draw Google "G" Logo centered inside the white box (size 72x72)
        const gIconSize = 72;
        context.drawImage(gIconImg, borderX + borderSize / 2 - gIconSize / 2, borderY + borderSize / 2 - gIconSize / 2, gIconSize, gIconSize);

        // 9. Draw Business Info
        context.fillStyle = "#0f172a"; // slate-900
        context.font = "bold 32px sans-serif";
        context.fillText(business.name.toUpperCase(), canvas.width / 2, 875);

        const subLabel = `${categoryLabels[business.category] || "Local Business"} in ${business.area || business.city}`;
        context.fillStyle = "#64748b"; // slate-500
        context.font = "bold 24px sans-serif";
        context.fillText(subLabel, canvas.width / 2, 915);

        // 10. Draw clean divider line
        context.strokeStyle = "#f1f5f9"; // slate-100
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(100, 970);
        context.lineTo(900, 970);
        context.stroke();

        // 11. Draw WiseReview Pill Badge at bottom
        const pillW = 340;
        const pillH = 70;
        const pillX = (canvas.width - pillW) / 2;
        const pillY = 1030;
        context.fillStyle = "#111827"; // dark gray
        context.beginPath();
        context.roundRect(pillX, pillY, pillW, pillH, 35);
        context.fill();

        // "Powered by" inside pill
        context.fillStyle = "rgba(255, 255, 255, 0.4)";
        context.font = "bold 18px sans-serif";
        context.textAlign = "left";
        context.fillText("POWERED BY", pillX + 35, pillY + 42);

        // Logo inside pill
        const targetWidth = 140;
        const aspectRatio = logoImage.naturalHeight / logoImage.naturalWidth;
        const targetHeight = targetWidth * aspectRatio;
        context.drawImage(logoImage, pillX + 165, pillY + (pillH - targetHeight) / 2, targetWidth, targetHeight);

        // 12. Trigger download
        const png = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = png;
        downloadLink.download = `wisereview-qr-${businessSlug}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      window.URL.revokeObjectURL(blobURL);
    }).catch(err => {
      console.error("Error generating printable QR PNG with branding", err);
      window.URL.revokeObjectURL(blobURL);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans relative select-none">
        {/* Sidebar shell */}
        <aside className="hidden lg:flex fixed inset-y-3 left-3 z-50 w-52 rounded-[22px] bg-[#0b0b0d] border border-white/10 flex-col overflow-hidden transform-gpu">
          <div className="h-14 flex items-center px-5 border-b border-white/[0.06]">
            <img src={wiseReviewLogo} alt="WiseReview" className="h-5 w-auto object-contain opacity-40" />
          </div>
          <div className="flex-1 px-3 pt-4 space-y-1">
            <Skeleton className="h-2.5 w-12 mb-2 ml-2 bg-white/[0.06]" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-2 py-[7px]">
                <Skeleton className="w-8 h-8 rounded-[10px] bg-white/[0.06]" />
                <Skeleton className="h-3.5 w-20 bg-white/[0.06]" />
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-white/[0.06] space-y-1.5">
            <Skeleton className="h-9 rounded-lg bg-white/[0.06]" />
            <Skeleton className="h-9 rounded-lg bg-white/[0.06]" />
          </div>
        </aside>

        {/* Main shell */}
        <div className="lg:pl-[232px]">
          <header className="sticky top-0 z-30 h-20 bg-[#050505]/95 border-b border-white/10 flex items-center justify-between px-4 sm:px-8 transform-gpu">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 bg-white/[0.06]" />
              <Skeleton className="h-3 w-48 bg-white/[0.05] hidden sm:block" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-28 rounded-xl bg-white/[0.06] hidden sm:block" />
              <Skeleton className="h-9 w-9 rounded-full bg-white/[0.06]" />
            </div>
          </header>

          <main className="p-4 sm:p-8 space-y-6 max-w-[1400px]">
            <Skeleton className="h-28 rounded-3xl bg-white/[0.05]" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl bg-white/[0.05]" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <Skeleton className="lg:col-span-7 h-72 rounded-3xl bg-white/[0.05]" />
              <Skeleton className="lg:col-span-5 h-72 rounded-3xl bg-white/[0.05]" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#e5e5e5] flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
        <h3 className="text-xl font-bold text-white">Business profile not found</h3>
        <p className="text-sm text-white/40 font-light max-w-sm mt-1">We couldn't retrieve the configuration for “{businessSlug}”.</p>
        <button onClick={onLogout} className="mt-6 px-5 py-2.5 bg-white/5 border border-white/10 text-sm text-[#e5e5e5] rounded-xl cursor-pointer hover:bg-white/10 transition-all">
          Return to Sign In
        </button>
      </div>
    );
  }

  const meta = PAGE_META[activeTab];

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans relative select-none">
      {/* Glow Orbs */}
      <div 
        className="fixed top-0 left-40 w-96 h-96 pointer-events-none transform-gpu animate-[pulse_8s_ease-in-out_infinite]" 
        style={{ background: "radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, rgba(99, 102, 241, 0) 70%)" }}
      />
      <div 
        className="fixed bottom-0 right-0 w-96 h-96 pointer-events-none transform-gpu animate-[pulse_8s_ease-in-out_infinite]" 
        style={{ background: "radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0) 70%)" }}
      />

      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ============ SIDEBAR ============ */}
      <aside
        className={`fixed inset-y-3 left-3 z-50 w-52 rounded-[22px] bg-[#0b0b0d] border border-white/10 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden transition-transform duration-300 lg:translate-x-0 transform-gpu ${
          sidebarOpen ? "translate-x-0" : "-translate-x-[120%]"
        }`}
      >
        {/* Logo */}
        <div className="relative h-14 flex items-center px-5 border-b border-white/[0.06]">
          <img src={wiseReviewLogo} alt="WiseReview" className="h-5 w-auto object-contain" referrerPolicy="no-referrer" />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute right-3 p-1.5 text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/20 px-2.5 mb-2">Menu</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
                className="relative w-full flex items-center gap-2.5 px-2 py-[7px] rounded-xl text-[13px] font-semibold transition-colors cursor-pointer group"
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/[0.12] to-violet-600/[0.05] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  />
                )}
                <span
                  className={`relative z-10 w-8 h-8 rounded-[10px] flex items-center justify-center transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-[0_4px_12px_-3px_rgba(99,102,241,0.4)]"
                      : "text-white/40 group-hover:text-white/70"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={active ? 2.4 : 1.8} />
                </span>
                <span className={`relative z-10 transition-colors ${active ? "text-white" : "text-white/50 group-hover:text-white/80"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-white/[0.06] space-y-1.5">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-white/50 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/80 transition-all cursor-pointer"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-white/50 bg-white/[0.03] border border-white/[0.06] hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="lg:pl-[232px] relative z-10">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-20 bg-[#050505]/95 border-b border-white/10 px-4 sm:px-8 transform-gpu">
          <div className="max-w-[1400px] w-full h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-white/60 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{meta.title}</h1>
              <p className="text-xs text-white/40 font-light hidden sm:block">{meta.sub}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> PRO
            </span>
            <button
              onClick={() => onNavigateToPublic(businessSlug)}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl hover:from-indigo-400 hover:to-violet-500 transition-all cursor-pointer"
            >
              View Public Page <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <div className="pl-1">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 rounded-full ring-2 ring-white/10 hover:ring-indigo-400/60 transition-all",
                  },
                }}
              />
            </div>
          </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6 max-w-[1400px] w-full">
          <AnimatePresence mode="wait">

            {/* ============ OVERVIEW ============ */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-5"
              >
                {/* Welcome banner */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/60 tracking-tight">
                    Welcome back{business.contact_name ? `, ${business.contact_name.split(" ")[0]}` : ""} 👋
                  </h2>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: <QrCode className="w-4 h-4" />, tint: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", glow: "group-hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]", value: totalScans, label: "Total Scans", note: `+${velocity.thisWeek} this week` },
                    { icon: <MousePointerClick className="w-4 h-4" />, tint: "text-violet-400 bg-violet-500/10 border-violet-500/20", glow: "group-hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]", value: totalRedirects, label: "Redirects to Google", note: `Copy & Post clicks` },
                    { icon: <TrendingUp className="w-4 h-4" />, tint: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", glow: "group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]", value: `${conversionRate}%`, label: "Conversion Rate", note: `Completed the loop` },
                    { icon: <Zap className="w-4 h-4" />, tint: "text-amber-400 bg-amber-500/10 border-amber-500/20", glow: "group-hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]", value: velocity.thisWeek, label: "Weekly Velocity", note: velocity.thisWeek >= velocity.lastWeek ? `Up from ${velocity.lastWeek}` : `Down from ${velocity.lastWeek}` },
                  ].map((s, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -3 }}
                      className={`group relative bg-[#0e0e11] border border-white/10 rounded-[20px] p-4 sm:p-5 transition-all duration-300 hover:border-white/20 hover:bg-[#121216] transform-gpu ${s.glow}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent rounded-[20px] pointer-events-none" />
                      <div className="relative z-10 flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-[14px] border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${s.tint}`}>
                          {s.icon}
                        </div>
                      </div>
                      <div className="relative z-10 space-y-0.5">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{s.value}</div>
                        <div className="text-[11px] font-bold text-white/50 uppercase tracking-widest">{s.label}</div>
                      </div>
                      <div className="relative z-10 text-xs text-white/40 font-light mt-3 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-current transition-colors" />
                        {s.note}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Preview + Recent events */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Live preview */}
                  <div className="lg:col-span-7 bg-[#0e0e11] border border-white/10 rounded-[20px] p-5 sm:p-6 space-y-4 relative overflow-hidden group transform-gpu">
                    <div 
                      className="absolute top-0 right-0 w-64 h-64 pointer-events-none transition-opacity duration-500 opacity-60 group-hover:opacity-100" 
                      style={{ background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0) 70%)" }}
                    />
                    
                    <div className="relative z-10 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base sm:text-lg tracking-tight">Live Review Preview</h3>
                          <p className="text-white/50 text-[11px] font-light">Real-time combination of your fragments.</p>
                        </div>
                      </div>
                      <button
                        onClick={handleRegeneratePreview}
                        className="p-2 border border-white/10 hover:border-indigo-400/30 bg-white/5 text-white/60 hover:text-indigo-300 rounded-xl active:scale-[0.96] transition-all shadow-sm hover:shadow-indigo-500/20 cursor-pointer"
                        title="Regenerate"
                      >
                        <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-700" />
                      </button>
                    </div>

                    <div className="relative z-10 rounded-xl border border-white/10 bg-black/35 p-4 sm:p-5 shadow-inner transform-gpu">
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <motion.div key={s} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: s * 0.1 }}>
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" />
                          </motion.div>
                        ))}
                      </div>
                      <p className="text-sm sm:text-base leading-relaxed text-white/90 italic font-medium">"{previewText}"</p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-white/40">
                        <span className="bg-white/5 px-2 py-1 rounded-md">{previewText.length} / 280 chars</span>
                        <span className="flex items-center gap-1.5 text-indigo-400/80 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> 100% unique
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 flex flex-col sm:flex-row gap-3 pt-1">
                      <button
                        onClick={handleCopyPreview}
                        className={`flex-1 py-2.5 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer text-sm shadow-lg ${
                          copied ? "bg-emerald-500 text-white shadow-emerald-500/25" : "bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 hover:border-white/20"
                        }`}
                      >
                        {copied ? (<><Check className="w-4 h-4" /> Copied</>) : (<><Copy className="w-4 h-4" /> Copy Sample</>)}
                      </button>
                      <button
                        onClick={() => onNavigateToPublic(businessSlug)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-600 text-white font-bold rounded-xl hover:from-indigo-400 hover:to-fuchsia-500 transition-all active:scale-[0.98] cursor-pointer text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 border border-white/10"
                      >
                        Open Public Page <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Recent events */}
                  <div className="lg:col-span-5 bg-[#0e0e11] border border-white/10 rounded-[20px] p-5 sm:p-6 space-y-4 transform-gpu">
                    <div>
                      <h3 className="font-bold text-white text-base sm:text-lg tracking-tight">Recent Activity</h3>
                      <p className="text-white/50 text-[11px] font-light">Latest customers who scanned your QR.</p>
                    </div>
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                      {clientScanEvents.length === 0 ? (
                        <div className="text-center py-10 text-white/30 text-sm font-light space-y-2 bg-black/20 rounded-xl border border-white/5">
                          <QrCode className="w-8 h-8 mx-auto text-white/20 animate-pulse" />
                          <p>No scans recorded yet.</p>
                          <p className="text-xs text-white/20">Activity appears here in real time.</p>
                        </div>
                      ) : (
                        [...clientScanEvents]
                          .sort((a, b) => {
                            const dateA = a.scanned_at?.toDate ? a.scanned_at.toDate() : new Date(a.scanned_at);
                            const dateB = b.scanned_at?.toDate ? b.scanned_at.toDate() : new Date(b.scanned_at);
                            return dateB - dateA;
                          })
                          .slice(0, 6)
                          .map((e, index) => {
                            const date = e.scanned_at?.toDate ? e.scanned_at.toDate() : new Date(e.scanned_at);
                            const isApple = e.user_agent.includes("iPhone") || e.user_agent.includes("Mac");
                            return (
                              <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={index} 
                                className="flex justify-between items-center p-2.5 sm:p-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8.5 h-8.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 text-[9px] font-bold shadow-inner">
                                    {isApple ? "iOS" : "AND"}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-white/80 font-medium">New Scan</span>
                                    <span className="text-[11px] text-white/40 font-light">
                                      {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                </div>
                                {e.redirected_to_google ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Posted
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 font-bold uppercase tracking-wider">Scanned</span>
                                )}
                              </motion.div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============ QR CODE ============ */}
            {activeTab === "qr" && (
              <motion.div
                key="qr"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
              >
                {/* QR card */}
                <div className="bg-white text-slate-900 rounded-[32px] overflow-hidden shadow-[0_24px_80px_-12px_rgba(0,0,0,0.35)] max-w-sm mx-auto border border-slate-100">
                  {/* Hidden hi-res SVG for download */}
                  <div className="hidden">
                    <QRCodeSVG id="qr-svg-code" value={publicUrl} size={512} level="H" includeMargin={true} />
                  </div>

                  {/* Card top — white section with Google branding */}
                  <div className="flex flex-col items-center gap-4 px-8 pt-8 pb-6">
                    {/* Google wordmark using colored spans */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center" style={{ fontFamily: "'Product Sans', 'Arial', sans-serif", fontSize: "36px", fontWeight: 400, letterSpacing: "-1px", lineHeight: 1 }}>
                        <span style={{ color: "#4285F4" }}>G</span>
                        <span style={{ color: "#EA4335" }}>o</span>
                        <span style={{ color: "#FBBC05" }}>o</span>
                        <span style={{ color: "#4285F4" }}>g</span>
                        <span style={{ color: "#34A853" }}>l</span>
                        <span style={{ color: "#EA4335" }}>e</span>
                      </div>
                      <p className="text-[15px] font-bold text-slate-700 tracking-tight text-center">
                        Check us out on Google
                      </p>
                    </div>

                    {/* QR Code with 4-color Google border */}
                    <div
                      className="p-[5px] rounded-[22px] shadow-xl"
                      style={{ background: 'linear-gradient(135deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%)' }}
                    >
                      <div className="bg-white p-3 rounded-[18px]">
                        <QRCodeSVG
                          value={publicUrl}
                          size={192}
                          level="H"
                          includeMargin={false}
                          imageSettings={{
                            src: googleGLogo,
                            height: 34,
                            width: 34,
                            excavate: true,
                          }}
                        />
                      </div>
                    </div>

                    {/* Business info */}
                    <div className="text-center space-y-0.5">
                      <div className="text-sm font-black text-slate-900 tracking-wide">{business.name}</div>
                      <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        {categoryLabels[business.category] || "Local Business"} · {business.area || business.city}
                      </div>
                    </div>
                  </div>

                  {/* Card bottom — dark branded section */}
                  <div className="bg-slate-950 px-8 py-5 flex flex-col items-center gap-4">
                    {/* Platform Branding pill */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-indigo-500/50 shadow-[0_0_14px_-3px_rgba(99,102,241,0.5)]">
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/40">Powered by</span>
                      <img
                        src={wiseReviewLogo}
                        alt="WiseReview"
                        className="h-4 w-auto object-contain"
                      />
                    </div>

                    <button
                      onClick={handleDownloadQR}
                      className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold rounded-xl hover:from-indigo-400 hover:to-violet-500 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                      <Download className="w-4 h-4" /> Download Printable PNG
                    </button>
                  </div>
                </div>

                {/* Info + URL */}
                <div className="space-y-5">
                  <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Destination URL</span>
                    <div className="flex items-center gap-2 bg-[#080809] border border-white/10 rounded-xl px-4 py-3">
                      <code className="text-xs text-white/60 font-light truncate flex-1">{publicUrl}</code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(publicUrl); }}
                        className="p-1.5 text-white/40 hover:text-indigo-400 transition-colors cursor-pointer"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => window.open(publicUrl, "_blank")}
                      className="w-full py-3 border border-white/10 hover:border-white/20 bg-white/5 text-white/80 font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      Test Scan Flow <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 space-y-4">
                    <h4 className="font-bold text-white text-sm">Where to place your QR code</h4>
                    <ul className="space-y-3">
                      {[
                        "Print on receipts and invoices",
                        "Add a table tent or desk stand at checkout",
                        "Include on business cards and flyers",
                        "Display a sticker near the exit",
                      ].map((tip) => (
                        <li key={tip} className="flex items-center gap-3 text-sm text-white/70 font-light">
                          <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" /> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============ FRAGMENTS ============ */}
            {activeTab === "fragments" && fragmentSet && (
              <motion.div
                key="fragments"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                <div className="lg:col-span-8 space-y-5">
                  {/* Category pills */}
                  <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
                    {[
                      { key: "openings", label: "Openings" },
                      { key: "services", label: "Services" },
                      { key: "locations", label: "Locations" },
                      { key: "experiences", label: "Experiences" },
                      { key: "staff_mentions", label: "Staff" },
                      { key: "endings", label: "Endings" },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => setActiveFragmentCat(cat.key as any)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          activeFragmentCat === cat.key ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" : "text-white/40 hover:text-white bg-white/5 border border-white/10"
                        }`}
                      >
                        {cat.label} · {fragmentSet[cat.key as keyof FragmentSet]?.length || 0}
                      </button>
                    ))}
                  </div>

                  {/* Add fragment */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder={`Add a new ${activeFragmentCat.replace("_", " ")} phrase…`}
                      value={newFragmentText}
                      onChange={(e) => setNewFragmentText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddFragment(); }}
                      className="flex-1 bg-[#080809] border border-white/10 px-4 py-3 rounded-xl text-white placeholder-white/25 text-sm outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/40 transition-all font-light"
                    />
                    <button
                      onClick={handleAddFragment}
                      className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-400 hover:to-violet-500 transition-all active:scale-[0.97] cursor-pointer flex items-center gap-1.5 text-sm"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>

                  {/* Fragment list */}
                  <div className="space-y-3">
                    {fragmentSet[activeFragmentCat].map((frag, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all group">
                        <p className="text-white/75 text-sm font-light leading-relaxed">"{frag}"</p>
                        <button
                          onClick={() => handleDeleteFragment(idx)}
                          className="p-1.5 text-white/40 hover:text-rose-400 bg-[#080809] border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {fragmentSet[activeFragmentCat].length === 0 && (
                      <div className="text-center py-12 text-white/30 text-sm font-light border border-dashed border-white/10 rounded-2xl">
                        No phrases here yet. Add some above to feed your generation pool.
                      </div>
                    )}
                  </div>
                </div>

                {/* Placeholder helper */}
                <div className="lg:col-span-4 bg-white/[0.04] border border-white/10 p-6 rounded-3xl space-y-5">
                  <div>
                    <h4 className="font-bold text-white text-base">Placeholder Tags</h4>
                    <p className="text-white/50 text-xs font-light">Insert these to auto-fill business details.</p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { tag: "[BusinessName]", val: business.name },
                      { tag: "[Area]", val: business.area },
                      { tag: "[City]", val: business.city },
                      { tag: "[ContactName]", val: business.contact_name },
                    ].map((p) => (
                      <div key={p.tag} className="p-3.5 bg-[#080809] rounded-xl border border-white/10">
                        <code className="text-indigo-400 font-mono font-bold text-xs">{p.tag}</code>
                        <p className="text-white/50 font-light text-[11px] mt-1">→ <span className="text-white/70">{p.val || "—"}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============ SETTINGS ============ */}
            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="max-w-2xl space-y-5"
              >
                {saveSuccess && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" /> Profile updated successfully.
                  </div>
                )}

                <form onSubmit={handleSaveSettings} className="bg-white/[0.04] border border-white/10 p-6 sm:p-8 rounded-3xl space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Business Name</label>
                    <input type="text" required value={settingsName} onChange={(e) => setSettingsName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#080809] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/40 transition-all font-light" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Owner / Manager Name</label>
                    <input type="text" required value={settingsContact} onChange={(e) => setSettingsContact(e.target.value)}
                      className="w-full px-4 py-3 bg-[#080809] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/40 transition-all font-light" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Neighborhood / Area</label>
                      <input type="text" required value={settingsArea} onChange={(e) => setSettingsArea(e.target.value)}
                        className="w-full px-4 py-3 bg-[#080809] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/40 transition-all font-light" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">City</label>
                      <input type="text" required value={settingsCity} onChange={(e) => setSettingsCity(e.target.value)}
                        className="w-full px-4 py-3 bg-[#080809] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/40 transition-all font-light" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Google Place ID</label>
                    <input type="text" required value={settingsPlaceId} onChange={(e) => setSettingsPlaceId(e.target.value)}
                      className="w-full px-4 py-3 bg-[#080809] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/40 transition-all font-light font-mono" />
                  </div>

                  <button type="submit" disabled={saveLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-400 hover:to-violet-500 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm">
                    {saveLoading ? "Saving…" : (<><Check className="w-4 h-4" /> Save Changes</>)}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ============ BILLING ============ */}
            {activeTab === "billing" && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="max-w-2xl space-y-5"
              >
                <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
                  <div className="flex justify-between items-start pb-6 border-b border-white/10">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Current Plan</span>
                      <h4 className="text-2xl font-black text-white">WiseReview Pro</h4>
                      <p className="text-emerald-400 text-xs font-semibold">Lifetime access · Active</p>
                    </div>
                    <span className="text-xs px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold uppercase tracking-wider">
                      Pro
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60 font-light">Review scans</span>
                      <span className="text-indigo-400 font-bold">Unlimited</span>
                    </div>
                    <div className="h-2 w-full bg-[#080809] border border-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-500/[0.06] border border-indigo-500/20 rounded-2xl text-xs text-white/60 leading-relaxed font-light flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white font-semibold">Pro benefits active:</span> unlimited review scans, custom fragment editor, full conversion analytics, no watermark, and priority support.
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">₹2,999</span>
                    <span className="text-white/40 font-light text-sm">one-time · lifetime</span>
                  </div>

                  <button
                    onClick={() => alert("Subscription management portal is coming soon!")}
                    className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer text-sm"
                  >
                    Manage Billing
                  </button>
                </div>

                {/* Plan comparison note */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                    <div className="text-sm font-bold text-white">Free</div>
                    <div className="text-2xl font-extrabold text-white mt-1">₹0</div>
                    <div className="text-[11px] text-white/40 font-light mt-1">5 review scans / month</div>
                  </div>
                  <div className="bg-gradient-to-b from-indigo-500/[0.08] to-transparent border border-indigo-500/25 rounded-2xl p-5">
                    <div className="text-sm font-bold text-indigo-300">Pro</div>
                    <div className="text-2xl font-extrabold text-white mt-1">₹2,999</div>
                    <div className="text-[11px] text-white/40 font-light mt-1">Unlimited · lifetime</div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
