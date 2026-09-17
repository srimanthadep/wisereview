import { createClient } from "@supabase/supabase-js";

// Supabase project config.
// The anon key is safe to expose in the browser (protected by Row Level Security).
// NEVER put the service_role key in client code.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://fmslzlcmoroktpjuchru.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtc2x6bGNtb3Jva3RwanVjaHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4OTcxOTYsImV4cCI6MjA5ODQ3MzE5Nn0.UylKzGt5ahdFP_rb44nLaURaAxwJX60Dx7YSv4VhuOA";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase config (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Auth is handled by Clerk; we don't use Supabase Auth sessions.
    persistSession: false,
    autoRefreshToken: false,
  },
});
