import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../supabase";
import { 
  OnboardingData, 
  BusinessCategory, 
  CATEGORY_LABELS, 
  PRAISE_OPTIONS
} from "../types";
import { getStarterFragments } from "../lib/generator";
import { 
  Building, 
  MapPin, 
  User, 
  Search, 
  HelpCircle, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  Scissors,
  Utensils,
  Dumbbell,
  ShoppingBag,
  Briefcase,
  Sun,
  Moon,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import wiseReviewLogo from "../assets/images/logo.png";

interface OnboardingProps {
  userId: string;
  onOnboardingComplete: (businessSlug: string) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export default function Onboarding({ userId, onOnboardingComplete, theme, toggleTheme }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const [formData, setFormData] = useState<OnboardingData>({
    category: "dental",
    name: "",
    contact_name: "",
    area: "",
    city: "",
    google_place_id: "",
    praisePoints: []
  });

  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const autocompleteServiceRef = useRef<any>(null);

  // Load Google Maps script tag dynamically when entering step 3
  useEffect(() => {
    if (step === 3) {
      if (window.google?.maps?.places) return;

      const scriptId = "google-maps-places-script";
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDGLqiG9S1Y9qMOd4RM0P24UhrZPROJXTY&libraries=places`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }
  }, [step]);

  const runMockSearch = (queryText: string) => {
    setSearching(true);
    const bizCity = formData.city || "Mumbai";
    const bizArea = formData.area || "Bandra";

    setTimeout(() => {
      const capitalize = (str: string) =>
        str.replace(/\b\w/g, (char) => char.toUpperCase());

      const cleanQuery = capitalize(queryText.trim());

      let detectedCity = bizCity;
      if (queryText.toLowerCase().includes("mumbai")) detectedCity = "Mumbai";
      else if (queryText.toLowerCase().includes("delhi")) detectedCity = "Delhi";
      else if (queryText.toLowerCase().includes("bangalore") || queryText.toLowerCase().includes("bengaluru")) detectedCity = "Bangalore";
      else if (queryText.toLowerCase().includes("chennai")) detectedCity = "Chennai";
      else if (queryText.toLowerCase().includes("kolkata")) detectedCity = "Kolkata";
      else if (queryText.toLowerCase().includes("pune")) detectedCity = "Pune";
      else if (queryText.toLowerCase().includes("hyderabad")) detectedCity = "Hyderabad";

      const mockResults = [
        {
          name: cleanQuery,
          address: `12, Pine Circle, ${bizArea}, ${detectedCity}, India`,
          place_id: `ChIJP_${cleanQuery.replace(/[^a-zA-Z0-9]/g, "")}_1200`,
        },
        {
          name: `${cleanQuery} Center`,
          address: `Block A, Park Avenue, ${bizArea}, ${detectedCity}, India`,
          place_id: `ChIJP_${cleanQuery.replace(/[^a-zA-Z0-9]/g, "")}_Center_405`,
        },
        {
          name: `${cleanQuery} & Co.`,
          address: `22, Link Road, ${detectedCity}, India`,
          place_id: `ChIJP_${cleanQuery.replace(/[^a-zA-Z0-9]/g, "")}_Co_2200`,
        }
      ];

      setSearchResults(mockResults);
      setSearching(false);
    }, 300);
  };

  const handlePlaceSearch = (queryText: string) => {
    setSearchQuery(queryText);
    if (!queryText.trim()) {
      setSearchResults([]);
      return;
    }

    // Fallback if Google Maps script fails or is still loading
    if (!window.google?.maps?.places) {
      runMockSearch(queryText);
      return;
    }

    setSearching(true);

    try {
      if (!autocompleteServiceRef.current) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      }

      autocompleteServiceRef.current.getPlacePredictions({
        input: queryText,
        componentRestrictions: { country: "in" }, // Bound search to India
        types: ["establishment"] // Bound search to business establishments
      }, (predictions: any, status: any) => {
        setSearching(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          const results = predictions.map((p: any) => ({
            name: p.structured_formatting?.main_text || p.description,
            address: p.structured_formatting?.secondary_text || "",
            place_id: p.place_id
          }));
          setSearchResults(results);
        } else {
          setSearchResults([]);
        }
      });
    } catch (err) {
      console.error("Google Places lookup failed, using fallback:", err);
      runMockSearch(queryText);
    }
  };

  const handleCategorySelect = (category: BusinessCategory) => {
    setFormData({
      ...formData,
      category,
      praisePoints: [] // reset praise points on category change
    });
    setStep(2);
  };

  const handleNextStep = () => {
    setError("");
    if (step === 2) {
      if (!formData.name.trim()) return setError("Business name is required.");
      if (!formData.contact_name.trim()) return setError("Contact / Owner name is required.");
      if (!formData.area.trim()) return setError("Business area / neighborhood is required.");
      if (!formData.city.trim()) return setError("Business city is required.");
    }
    if (step === 3) {
      if (!formData.google_place_id.trim()) return setError("Google Place ID is required so we can redirect your customers to your review box.");
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setError("");
    setStep(step - 1);
  };

  const togglePraisePoint = (text: string) => {
    if (formData.praisePoints.includes(text)) {
      setFormData({
        ...formData,
        praisePoints: formData.praisePoints.filter(p => p !== text)
      });
    } else {
      setFormData({
        ...formData,
        praisePoints: [...formData.praisePoints, text]
      });
    }
  };

  // Helper to generate a unique slug
  const generateSlug = (name: string, city: string): string => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const cleanCity = city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}-${cleanCity}-${randomSuffix}`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const slug = generateSlug(formData.name, formData.city);

    try {
      // Get starter template lists, interpolating with selections
      const starterFragments = getStarterFragments(
        formData.category,
        formData.name,
        formData.contact_name,
        formData.area,
        formData.city,
        formData.praisePoints
      );

      // 1. Create Business Row (slug is the primary key)
      const { error: bizError } = await supabase.from("businesses").insert({
        slug,
        owner_id: userId,
        name: formData.name.trim(),
        category: formData.category,
        contact_name: formData.contact_name.trim(),
        area: formData.area.trim(),
        city: formData.city.trim(),
        google_place_id: formData.google_place_id.trim(),
        plan: "pro",
        created_at: new Date().toISOString(),
      });
      if (bizError) throw bizError;

      // 2. Create Fragment Set Row (business_id is the primary key)
      const { error: fragError } = await supabase.from("fragment_sets").insert({
        business_id: slug,
        owner_id: userId,
        ...starterFragments,
      });
      if (fragError) throw fragError;

      onOnboardingComplete(slug);
    } catch (err) {
      console.error("Onboarding submission failed", err);
      setError("Failed to create business configuration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (cat: BusinessCategory) => {
    switch (cat) {
      case "dental": return <Building className="w-6 h-6 text-teal-400" />;
      case "salon": return <Scissors className="w-6 h-6 text-pink-400" />;
      case "restaurant": return <Utensils className="w-6 h-6 text-amber-400" />;
      case "gym": return <Dumbbell className="w-6 h-6 text-purple-400" />;
      case "retail": return <ShoppingBag className="w-6 h-6 text-blue-400" />;
      default: return <Briefcase className="w-6 h-6 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] flex flex-col justify-center items-center px-4 relative font-sans select-none py-12">
      
      {/* Floating Theme Toggle */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 flex items-center justify-center p-2.5 text-white/60 bg-white/5 border border-white/10 rounded-xl transition-all hover:bg-white/10 cursor-pointer z-50"
        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-teal-400" />}
      </button>

      {/* Decorative Orbs */}
      <div className="absolute top-10 left-10 w-[30vw] h-[30vw] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[30vw] h-[30vw] bg-blue-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Logo display */}
      <div className="mb-4 flex items-center justify-center gap-2.5">
        <img 
          src="/logo_without_text.png" 
          alt="WiseReview" 
          className="h-7 w-auto object-contain"
          referrerPolicy="no-referrer"
        />
        <span className="font-rosemary text-2xl font-bold tracking-tight text-white">
          WiseReview
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full max-w-xl mb-10">
        <div className="flex justify-between items-center text-xs font-semibold text-white/40 uppercase tracking-widest mb-3 px-1">
          <span>Onboarding Progress</span>
          <span>Step {step} of 4</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-teal-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-xl bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] p-8 sm:p-10 shadow-2xl relative">
        
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm text-center">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* STEP 1: Business Category */}
          {step === 1 && (
            <motion.div 
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400">Step 1 — Segmentation</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">What type of business do you operate?</h3>
                <p className="text-white/60 text-sm font-light">
                  This configures your starting combinatorial templates with phrases custom-tailored for your specific business category.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                {(Object.keys(CATEGORY_LABELS) as BusinessCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-[120px] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                      formData.category === cat 
                        ? "bg-[#050505] border-teal-500 shadow-lg shadow-teal-500/10" 
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {getCategoryIcon(cat)}
                    <span className="font-bold text-sm text-white">{CATEGORY_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Business Info */}
          {step === 2 && (
            <motion.div 
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400">Step 2 — Coordinates</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">Tell us about your business</h3>
                <p className="text-white/60 text-sm font-light">
                  Provide coordinates so reviews generated can reference your local area and city, raising your local Map pack ranking signals.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Business Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/30">
                      <Building className="w-4 h-4" />
                    </span>
                    <input 
                      type="text"
                      placeholder="e.g. Sparsh Dental Clinic"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-[#050505] border border-white/10 rounded-xl text-[#e5e5e5] placeholder-white/20 text-sm outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/40 transition-all font-light"
                    />
                  </div>
                </div>

                {/* Contact Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Owner / Lead Practitioner Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/30">
                      <User className="w-4 h-4" />
                    </span>
                    <input 
                      type="text"
                      placeholder="e.g. Dr. Ananya Sharma"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-[#050505] border border-white/10 rounded-xl text-[#e5e5e5] placeholder-white/20 text-sm outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/40 transition-all font-light"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Area */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Neighborhood / Area</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/30">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <input 
                        type="text"
                        placeholder="e.g. Bandra West"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-[#050505] border border-white/10 rounded-xl text-[#e5e5e5] placeholder-white/20 text-sm outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/40 transition-all font-light"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">City</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/30">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <input 
                        type="text"
                        placeholder="e.g. Mumbai"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-[#050505] border border-white/10 rounded-xl text-[#e5e5e5] placeholder-white/20 text-sm outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/40 transition-all font-light"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handlePrevStep}
                  className="px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 text-[#e5e5e5] font-bold rounded-xl active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer text-sm"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={handleNextStep}
                  className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:from-teal-400 hover:to-blue-500 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 text-sm"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Google Place ID */}
          {step === 3 && (
            <motion.div 
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400">Step 3 — Google Integration</span>
                  <button 
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="p-1 text-white/40 hover:text-teal-400 relative"
                  >
                    <HelpCircle className="w-5 h-5" />
                    {showTooltip && (
                      <div className="absolute right-0 bottom-7 w-64 bg-[#050505] border border-white/10 rounded-xl p-3.5 text-xs text-white/80 leading-normal font-light shadow-2xl z-50">
                        Google Place ID is a unique string representing your business in Google's database, letting us construct the direct link where reviews go live.
                      </div>
                    )}
                  </button>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">Link Google Business Profile</h3>
                <p className="text-white/60 text-sm font-light">
                  Search for your business profile on Google Maps to automatically link your reviews page.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {/* Autocomplete Search input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Search Business Name on Maps</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/30">
                      <Search className="w-4.5 h-4.5" />
                    </span>
                    <input 
                      type="text"
                      placeholder="Type your business name..."
                      value={searchQuery}
                      onChange={(e) => handlePlaceSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#050505] border border-white/10 rounded-xl text-[#e5e5e5] placeholder-white/20 text-sm outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/40 transition-all font-light"
                    />
                    {searching && (
                      <span className="absolute inset-y-0 right-4 flex items-center">
                        <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Autocomplete Dropdown List */}
                {searchQuery.trim() && searchResults.length > 0 && !selectedProfile && (
                  <div className="bg-[#050505] border border-white/10 rounded-2xl overflow-hidden shadow-2xl divide-y divide-white/5 max-h-56 overflow-y-auto z-10 relative">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedProfile(result);
                          setFormData({
                            ...formData,
                            google_place_id: result.place_id
                          });
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="w-full p-4 text-left hover:bg-white/5 transition-all flex items-start gap-3 cursor-pointer"
                      >
                        <MapPin className="w-5 h-5 text-rose-500 fill-rose-500/20 flex-shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-white">{result.name}</div>
                          <div className="text-[11px] text-white/40 font-light">{result.address}</div>
                          <div className="text-[9px] text-teal-400/60 font-mono">ID: {result.place_id}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Connected profile confirmation card */}
                {selectedProfile && (
                  <div className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0">
                        <Check className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold uppercase tracking-wider font-mono">Google Profile Linked</span>
                        <h4 className="text-sm font-bold text-white">{selectedProfile.name}</h4>
                        <p className="text-[11px] text-white/60 font-light">{selectedProfile.address}</p>
                        <p className="text-[9px] text-white/30 font-mono font-light">Place ID: {selectedProfile.place_id}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProfile(null);
                        setFormData({
                          ...formData,
                          google_place_id: ""
                        });
                      }}
                      className="text-xs text-white/40 hover:text-white cursor-pointer underline decoration-dotted underline-offset-4"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Manual entry accordion */}
                <div className="border-t border-white/5 pt-4">
                  <details className="group cursor-pointer">
                    <summary className="text-xs text-white/40 hover:text-white flex items-center gap-1 list-none font-medium select-none outline-none">
                      <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-teal-400" />
                      Or enter Google Place ID manually
                    </summary>
                    <div className="mt-3 pl-5 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Your Google Place ID</label>
                        <input 
                          type="text"
                          placeholder="e.g. ChIJVX_Z5xCtS4gRl7qX9K3_C2Y"
                          value={formData.google_place_id}
                          onChange={(e) => setFormData({ ...formData, google_place_id: e.target.value })}
                          className="w-full px-4 py-2.5 bg-[#050505] border border-white/10 rounded-xl text-white placeholder-white/20 text-xs outline-none focus:border-teal-500/40 transition-all font-light"
                        />
                      </div>

                      <div className="bg-[#050505] border border-white/10 rounded-2xl p-4.5 space-y-2.5">
                        <span className="text-xs font-bold text-[#e5e5e5] flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-teal-400" /> How to find your Google Place ID manually:
                        </span>
                        <ol className="text-xs text-white/60 list-decimal pl-4 space-y-1.5 font-light leading-relaxed">
                          <li>Go to Google's official <a href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">Place ID Finder Map</a> in a new tab.</li>
                          <li>Enter your exact business name in the finder search box.</li>
                          <li>Select your business when it pops up, and click.</li>
                          <li>Copy the long code (e.g. <code className="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-teal-300">ChIJVX_Z...</code>) shown under the map pins!</li>
                        </ol>
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handlePrevStep}
                  className="px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 text-[#e5e5e5] font-bold rounded-xl active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer text-sm"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={handleNextStep}
                  className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:from-teal-400 hover:to-blue-500 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 text-sm"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Praise points selection */}
          {step === 4 && (
            <motion.div 
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400">Step 4 — Value Highlights</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">What do customers praise most?</h3>
                <p className="text-white/60 text-sm font-light">
                  Select key qualities usually praised by your clients. We'll pre-integrate these values into your combinatorial experiences array.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap gap-2.5">
                  {PRAISE_OPTIONS[formData.category].map((opt) => {
                    const isSelected = formData.praisePoints.includes(opt.text);
                    return (
                      <button
                        key={opt.label}
                        onClick={() => togglePraisePoint(opt.text)}
                        className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected 
                            ? "praise-point-active shadow-sm" 
                            : "bg-[#050505] border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-[#050505] rounded-2xl p-4.5 border border-white/10">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-white/30 block mb-2">Live Template Sample Preview</span>
                  <div className="text-xs text-white/60 italic font-light leading-relaxed">
                    {formData.praisePoints.length > 0 ? (
                      `"${formData.praisePoints[0].replace("[ContactName]", formData.contact_name || "the team")}"`
                    ) : (
                      `"We will use a variety of general positive feedback comments custom tailored to ${CATEGORY_LABELS[formData.category].toLowerCase()} services."`
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handlePrevStep}
                  className="px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 text-[#e5e5e5] font-bold rounded-xl active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer text-sm"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-extrabold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-400/25 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 text-sm"
                >
                  {loading ? "Generating Configuration..." : "Finish Setup & Load Dashboard"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
