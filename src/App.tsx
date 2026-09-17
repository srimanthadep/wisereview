/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { supabase } from "./supabase";
import LandingPage from "./components/LandingPage";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import PublicReviewPage from "./components/PublicReviewPage";
import { Skeleton } from "./components/Skeleton";

export default function App() {
  // Clerk auth state
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessChecked, setBusinessChecked] = useState(false);

  // Theme Management
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("wiseReviewTheme") as "dark" | "light") || "dark";
  });

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("wiseReviewTheme", newTheme);
  };

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  // Simple router
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState(null, "", to);
    setCurrentPath(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // When Clerk user signs in or changes, check Supabase for their business
  useEffect(() => {
    if (!clerkLoaded) return;

    if (!clerkUser) {
      // Signed out — clear state and redirect if on protected page
      setBusinessSlug(null);
      setBusinessChecked(true);
      if (window.location.pathname === "/dashboard" || window.location.pathname === "/onboarding") {
        navigate("/");
      }
      return;
    }

    // Clerk user is signed in — look up their business in Supabase
    const checkBusiness = async () => {
      setBusinessLoading(true);
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("slug")
          .eq("owner_id", clerkUser.id)
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const slug = data[0].slug;
          setBusinessSlug(slug);
          // Redirect to dashboard if on landing/auth
          if (window.location.pathname === "/" || window.location.pathname.startsWith("/auth")) {
            navigate("/dashboard");
          }
        } else {
          setBusinessSlug(null);
          // New user — go to onboarding
          if (window.location.pathname !== "/onboarding") {
            navigate("/onboarding");
          }
        }
      } catch (e) {
        console.error("Error checking business for Clerk user:", e);
        navigate("/onboarding");
      } finally {
        setBusinessLoading(false);
        setBusinessChecked(true);
      }
    };

    checkBusiness();
  }, [clerkUser, clerkLoaded]);

  // Handle onboarding complete
  const handleOnboardingComplete = (slug: string) => {
    setBusinessSlug(slug);
    navigate("/dashboard");
  };

  // Handle sign out (Clerk + local cleanup)
  const handleLogout = async () => {
    try {
      localStorage.removeItem("wiseReviewDemoUser");
      localStorage.removeItem("wiseReviewDemoBusiness");
      localStorage.removeItem("wiseReviewDemoFragments");
      await clerkSignOut();
      setBusinessSlug(null);
      navigate("/");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  // --- ROUTER VIEW ROUTING LOGIC ---

  // Loading: wait for Clerk to initialize and business check to complete
  if (!clerkLoaded || (clerkUser && !businessChecked) || businessLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col justify-center items-center gap-4 px-6">
        <Skeleton className="h-10 w-44 rounded-xl bg-white/[0.06]" />
        <div className="w-full max-w-sm space-y-3 mt-2">
          <Skeleton className="h-4 w-full bg-white/[0.05]" />
          <Skeleton className="h-4 w-4/5 mx-auto bg-white/[0.05]" />
          <Skeleton className="h-4 w-2/3 mx-auto bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  // A. Public Reviews router: Match /r/{slug}
  if (currentPath.startsWith("/r/")) {
    const slug = currentPath.substring(3).trim();
    return (
      <PublicReviewPage
        slug={slug}
        onNavigateHome={() => navigate("/")}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // B. Onboarding View (Clerk Auth Required)
  if (currentPath === "/onboarding") {
    if (!clerkUser) {
      navigate("/");
      return null;
    }
    return (
      <Onboarding
        userId={clerkUser.id}
        onOnboardingComplete={handleOnboardingComplete}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // C. Dashboard View (Clerk Auth Required)
  if (currentPath === "/dashboard") {
    if (!clerkUser) {
      navigate("/");
      return null;
    }
    if (!businessSlug) {
      return (
        <Onboarding
          userId={clerkUser.id}
          onOnboardingComplete={handleOnboardingComplete}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      );
    }
    return (
      <Dashboard
        businessSlug={businessSlug}
        onLogout={handleLogout}
        onNavigateToPublic={(slug) => navigate(`/r/${slug}`)}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // D. Default/Landing View
  return (
    <LandingPage
      theme={theme}
      toggleTheme={toggleTheme}
      onNavigateToDashboard={() => navigate("/dashboard")}
    />
  );
}
