/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import LandingPage from "./components/LandingPage";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import PublicReviewPage from "./components/PublicReviewPage";

export default function App() {
  // Persistent local owner ID (no auth required)
  const [userId] = useState<string>(() => {
    let id = localStorage.getItem("wiseReviewUserId");
    if (!id) {
      id = "owner_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("wiseReviewUserId", id);
    }
    return id;
  });

  const [businessSlug, setBusinessSlug] = useState<string | null>(() => {
    return localStorage.getItem("wiseReviewBusinessSlug") || null;
  });

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

  // Optional: check Supabase for business if not cached locally
  useEffect(() => {
    if (businessSlug) return;

    const checkExistingBusiness = async () => {
      try {
        const { data } = await supabase
          .from("businesses")
          .select("slug")
          .eq("owner_id", userId)
          .limit(1);

        if (data && data.length > 0) {
          const foundSlug = data[0].slug;
          setBusinessSlug(foundSlug);
          localStorage.setItem("wiseReviewBusinessSlug", foundSlug);
        }
      } catch (e) {
        console.warn("Could not query existing business from Supabase:", e);
      }
    };

    checkExistingBusiness();
  }, [userId, businessSlug]);

  // Handle onboarding complete
  const handleOnboardingComplete = (slug: string) => {
    setBusinessSlug(slug);
    localStorage.setItem("wiseReviewBusinessSlug", slug);
    navigate("/dashboard");
  };

  // Handle logout (clears local business session)
  const handleLogout = () => {
    localStorage.removeItem("wiseReviewBusinessSlug");
    setBusinessSlug(null);
    navigate("/");
  };

  // --- ROUTER VIEW ROUTING LOGIC ---

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

  // B. Onboarding View
  if (currentPath === "/onboarding") {
    return (
      <Onboarding
        userId={userId}
        onOnboardingComplete={handleOnboardingComplete}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // C. Dashboard View
  if (currentPath === "/dashboard") {
    if (!businessSlug) {
      return (
        <Onboarding
          userId={userId}
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
      onNavigateToDashboard={() => navigate(businessSlug ? "/dashboard" : "/onboarding")}
    />
  );
}
