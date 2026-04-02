import {
  createContext, useContext, useEffect, useState,
  useCallback, useRef, type ReactNode
} from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────
export interface StatItem {
  value: string;
  label: string;
  sub: string;
}

export interface FeatureItem {
  iconKey: string;
  title: string;
  desc: string;
  color: string;
}

export interface SiteSettings {
  // Branding
  siteName: string;
  siteSubtitle: string;
  logoUrl: string;

  // Hero Section
  heroBadge: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  heroCtaSignup: string;
  heroCtaLogin: string;

  // Stats & Features
  stats: StatItem[];
  features: FeatureItem[];

  // Bottom CTA
  ctaTitle: string;
  ctaSubtitle: string;

  // Footer contact
  footerTagline: string;
  footerAddress: string;
  footerPhone: string;
  footerEmail: string;

  // Color theme
  primaryColor: string;   // HSL without hsl() — e.g. "217 91% 60%"
  sidebarBg: string;      // HSL — e.g. "222 47% 11%"
  heroGradFrom: string;   // CSS hex — e.g. "#0f172a"
  heroGradTo: string;
  ctaGradFrom: string;
  ctaGradTo: string;
  accentColor: string;    // hex, for badges/highlights
  badgeTextColor: string; // hex
}

// ─── Color Theme Presets ─────────────────────────────────────
export interface ColorThemePreset {
  name: string;
  emoji: string;
  primaryColor: string;
  sidebarBg: string;
  heroGradFrom: string;
  heroGradTo: string;
  ctaGradFrom: string;
  ctaGradTo: string;
  accentColor: string;
  badgeTextColor: string;
}

export const COLOR_THEMES: ColorThemePreset[] = [
  {
    name: "Blue Purple",
    emoji: "🔵",
    primaryColor: "217 91% 60%",
    sidebarBg: "222 47% 11%",
    heroGradFrom: "#0f172a",
    heroGradTo: "#1e1b4b",
    ctaGradFrom: "#2563eb",
    ctaGradTo: "#7c3aed",
    accentColor: "#3b82f6",
    badgeTextColor: "#93c5fd",
  },
  {
    name: "Emerald Teal",
    emoji: "🟢",
    primaryColor: "158 64% 40%",
    sidebarBg: "158 40% 9%",
    heroGradFrom: "#0d1f17",
    heroGradTo: "#0c3b2e",
    ctaGradFrom: "#059669",
    ctaGradTo: "#0d9488",
    accentColor: "#10b981",
    badgeTextColor: "#6ee7b7",
  },
  {
    name: "Sunset Orange",
    emoji: "🟠",
    primaryColor: "24 95% 53%",
    sidebarBg: "20 47% 11%",
    heroGradFrom: "#1c0a00",
    heroGradTo: "#431400",
    ctaGradFrom: "#ea580c",
    ctaGradTo: "#dc2626",
    accentColor: "#f97316",
    badgeTextColor: "#fdba74",
  },
  {
    name: "Violet Pink",
    emoji: "💜",
    primaryColor: "262 83% 58%",
    sidebarBg: "262 47% 11%",
    heroGradFrom: "#130d24",
    heroGradTo: "#2d1052",
    ctaGradFrom: "#7c3aed",
    ctaGradTo: "#db2777",
    accentColor: "#8b5cf6",
    badgeTextColor: "#c4b5fd",
  },
  {
    name: "Rose Red",
    emoji: "🔴",
    primaryColor: "346 77% 50%",
    sidebarBg: "346 40% 11%",
    heroGradFrom: "#1a0a0e",
    heroGradTo: "#3b0a18",
    ctaGradFrom: "#e11d48",
    ctaGradTo: "#be123c",
    accentColor: "#f43f5e",
    badgeTextColor: "#fda4af",
  },
  {
    name: "Gold Dark",
    emoji: "🟡",
    primaryColor: "38 92% 50%",
    sidebarBg: "30 47% 9%",
    heroGradFrom: "#1a1200",
    heroGradTo: "#3b2a00",
    ctaGradFrom: "#d97706",
    ctaGradTo: "#92400e",
    accentColor: "#f59e0b",
    badgeTextColor: "#fcd34d",
  },
];

// ─── Defaults ────────────────────────────────────────────────
export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "GCT Hostel Link",
  siteSubtitle: "TEVTA Taxila",
  logoUrl: "/site-logo.png",

  heroBadge: "GCT TEVTA Hostel, Taxila",
  heroTitle: "Hostel Management",
  heroTitleHighlight: "Made Digital",
  heroSubtitle:
    "GCT Hostel Link replaces paper registers with a secure, real-time digital system for managing student admissions, attendance, mess fees, electricity bills, and complaints.",
  heroCtaSignup: "Student Sign Up",
  heroCtaLogin: "Login to Dashboard",

  stats: [
    { value: "500+", label: "Students Capacity", sub: "Jinnah & Iqbal Hostels" },
    { value: "50+", label: "Rooms", sub: "2 Shifts: Morning & Evening" },
    { value: "15+", label: "Staff Members", sub: "Admin, Teachers & Mess" },
    { value: "24/7", label: "Security", sub: "Round-the-clock safety" },
  ],

  features: [
    { iconKey: "users", title: "Student Management", desc: "Full student lifecycle from admission to graduation with profile management and approval workflows.", color: "text-blue-500" },
    { iconKey: "calendar", title: "Daily Attendance", desc: "Teachers mark attendance once per day. Records lock after 3 days. Admin can override anytime.", color: "text-green-500" },
    { iconKey: "dollar", title: "Mess Fee Tracking", desc: "Global and per-student fee management. Real-time paid/unpaid status. Cash payment tracking.", color: "text-orange-500" },
    { iconKey: "zap", title: "Electricity Bills", desc: "Monthly per-student electricity bills set by teachers. Full payment history and tracking.", color: "text-yellow-500" },
    { iconKey: "message", title: "Complaints System", desc: "Anonymous complaint submission. Teachers and admins manage resolutions with full audit trail.", color: "text-purple-500" },
    { iconKey: "shield", title: "Role-Based Access", desc: "Separate dashboards for Admin, Teacher, Mess Owner, and Student with strict permissions.", color: "text-red-500" },
  ],

  ctaTitle: "Ready to Get Started?",
  ctaSubtitle:
    "Students can sign up now. Admin, Teacher, and Mess Owner accounts are created by the administrator.",

  footerTagline:
    "A centralized digital system for managing student admissions, hostel attendance, mess fee payments, electricity bills, and complaints for GCT TEVTA Hostel, Taxila.",
  footerAddress: "HMC Road near HMC-3, GCT (TEVTA), Taxila, Punjab, Pakistan",
  footerPhone: "+92-51-1234567",
  footerEmail: "info@gcthostellink.edu.pk",

  ...COLOR_THEMES[0],
};

// ─── CSS Variable Injection ───────────────────────────────────
function applyThemeVars(s: SiteSettings) {
  const root = document.documentElement;
  root.style.setProperty("--primary", s.primaryColor);
  root.style.setProperty("--ring", s.primaryColor);
  root.style.setProperty("--sidebar-primary", s.primaryColor);
  root.style.setProperty("--sidebar-ring", s.primaryColor);
  root.style.setProperty("--chart-1", s.primaryColor);
  root.style.setProperty("--sidebar", s.sidebarBg);
  root.style.setProperty("--hero-grad-from", s.heroGradFrom);
  root.style.setProperty("--hero-grad-to", s.heroGradTo);
  root.style.setProperty("--cta-grad-from", s.ctaGradFrom);
  root.style.setProperty("--cta-grad-to", s.ctaGradTo);
  root.style.setProperty("--accent-color", s.accentColor);
  root.style.setProperty("--badge-text-color", s.badgeTextColor);
}

// ─── Context ─────────────────────────────────────────────────
interface SiteSettingsContextType {
  settings: SiteSettings;
  updateSettings: (partial: Partial<SiteSettings>) => void;
  saveSettings: () => Promise<boolean>;
  resetToDefaults: () => void;
  saving: boolean;
  loaded: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  saveSettings: async () => false,
  resetToDefaults: () => {},
  saving: false,
  loaded: false,
});

// ─── Provider ────────────────────────────────────────────────
export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const rowIdRef = useRef<string | null>(null);

  // Load from Supabase on mount
  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        rowIdRef.current = data.id;
        const saved = data.settings as Partial<SiteSettings>;
        const merged: SiteSettings = {
          ...DEFAULT_SETTINGS,
          ...saved,
          // Always fall back to default logo if stored value is empty
          logoUrl: saved.logoUrl || DEFAULT_SETTINGS.logoUrl,
        };
        setSettings(merged);
        applyThemeVars(merged);
      } else {
        // No DB row yet — use defaults and apply CSS vars
        applyThemeVars(DEFAULT_SETTINGS);
      }
      setLoaded(true);
    }
    loadSettings();
  }, []);

  // Subscribe to realtime changes so all users see updates live
  useEffect(() => {
    const channel = supabase
      .channel("site_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        (payload) => {
          if (payload.new && (payload.new as any).settings) {
            const saved = (payload.new as any).settings as Partial<SiteSettings>;
            const merged: SiteSettings = {
              ...DEFAULT_SETTINGS,
              ...saved,
              logoUrl: saved.logoUrl || DEFAULT_SETTINGS.logoUrl,
            };
            setSettings(merged);
            applyThemeVars(merged);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateSettings = useCallback((partial: Partial<SiteSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      applyThemeVars(next);
      return next;
    });
  }, []);

  const saveSettings = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    let error;
    if (rowIdRef.current) {
      const res = await supabase
        .from("site_settings")
        .update({ settings, updated_by: user?.id })
        .eq("id", rowIdRef.current);
      error = res.error;
    } else {
      const res = await supabase
        .from("site_settings")
        .insert({ settings, updated_by: user?.id })
        .select("id")
        .single();
      error = res.error;
      if (!error && res.data) rowIdRef.current = res.data.id;
    }

    setSaving(false);
    return !error;
  }, [settings]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    applyThemeVars(DEFAULT_SETTINGS);
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, updateSettings, saveSettings, resetToDefaults, saving, loaded }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
