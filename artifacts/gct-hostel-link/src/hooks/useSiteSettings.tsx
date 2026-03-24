import { createContext, useContext, useState, type ReactNode } from "react";

interface SiteSettings {
  siteName: string;
  siteSubtitle: string;
}

interface SiteSettingsContextType {
  settings: SiteSettings;
  updateSettings: (s: Partial<SiteSettings>) => void;
}

const defaults: SiteSettings = {
  siteName: "GCT Hostel Link",
  siteSubtitle: "TEVTA Taxila",
};

function load(): SiteSettings {
  try {
    const raw = localStorage.getItem("gct_site_settings");
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {}
  return defaults;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: defaults,
  updateSettings: () => {},
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(load);

  function updateSettings(s: Partial<SiteSettings>) {
    const next = { ...settings, ...s };
    setSettings(next);
    localStorage.setItem("gct_site_settings", JSON.stringify(next));
  }

  return (
    <SiteSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
