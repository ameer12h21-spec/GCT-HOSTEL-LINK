import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings, COLOR_THEMES, DEFAULT_SETTINGS } from "@/hooks/useSiteSettings";
import { supabase } from "@/lib/supabase";
import {
  Save, RotateCcw, Eye, Upload, Palette, Type,
  LayoutDashboard, Star, Phone, Image as ImageIcon,
  CheckCircle2, Loader2
} from "lucide-react";

// ─── Icon key options for feature cards ──────────────────────
const ICON_OPTIONS = [
  { key: "users", label: "👥 Users" },
  { key: "calendar", label: "📅 Calendar" },
  { key: "dollar", label: "💰 Dollar" },
  { key: "zap", label: "⚡ Zap" },
  { key: "message", label: "💬 Message" },
  { key: "shield", label: "🛡 Shield" },
  { key: "building", label: "🏢 Building" },
  { key: "book", label: "📚 Book" },
  { key: "star", label: "⭐ Star" },
  { key: "check", label: "✅ Check" },
];

// ─── Color swatch options for feature cards ───────────────────
const COLOR_OPTIONS = [
  { value: "text-blue-500", label: "Blue" },
  { value: "text-green-500", label: "Green" },
  { value: "text-orange-500", label: "Orange" },
  { value: "text-yellow-500", label: "Yellow" },
  { value: "text-purple-500", label: "Purple" },
  { value: "text-red-500", label: "Red" },
  { value: "text-pink-500", label: "Pink" },
  { value: "text-teal-500", label: "Teal" },
  { value: "text-indigo-500", label: "Indigo" },
  { value: "text-cyan-500", label: "Cyan" },
];

export default function AdminSiteSettings() {
  const { toast } = useToast();
  const { settings, updateSettings, saveSettings, resetToDefaults, saving } = useSiteSettings();
  const [logoUploading, setLogoUploading] = useState(false);

  async function handleSave() {
    const ok = await saveSettings();
    if (ok) {
      toast({ title: "Site settings saved!", description: "All changes are now live for all users." });
    } else {
      toast({ title: "Save failed", description: "Could not save. Check your connection.", variant: "destructive" });
    }
  }

  function handleReset() {
    resetToDefaults();
    toast({ title: "Reset to defaults", description: "Click Save to apply the reset." });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "File too large", description: "Logo must be under 3 MB.", variant: "destructive" });
      return;
    }
    setLogoUploading(true);
    const ext = file.name.split(".").pop();
    const path = `site-logo/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
      updateSettings({ logoUrl: data.publicUrl });
      toast({ title: "Logo uploaded!", description: "Click Save to apply it to the website." });
    }
    setLogoUploading(false);
  }

  function updateStat(index: number, field: string, value: string) {
    const newStats = [...settings.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    updateSettings({ stats: newStats });
  }

  function updateFeature(index: number, field: string, value: string) {
    const newFeatures = [...settings.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    updateSettings({ features: newFeatures });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Settings</h1>
          <p className="text-sm text-muted-foreground">Customize the website design, colors, and all content</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => window.open("/", "_blank")}>
            <Eye className="w-4 h-4 mr-1" /> Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-6 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        Changes apply instantly for preview. Click <strong className="mx-1">Save All</strong> to make them permanent and live for all users.
      </div>

      <Tabs defaultValue="branding">
        <TabsList className="flex-wrap h-auto gap-1 mb-6">
          <TabsTrigger value="branding" className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Branding
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Colors
          </TabsTrigger>
          <TabsTrigger value="hero" className="flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5" /> Hero
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" /> Stats & Features
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Contact & Footer
          </TabsTrigger>
        </TabsList>

        {/* ── BRANDING TAB ───────────────────────────────────── */}
        <TabsContent value="branding" className="space-y-4">
          <Card className="border border-border">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Type className="w-4 h-4" /> Site Name & Identity
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Site Name</label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => updateSettings({ siteName: e.target.value })}
                    placeholder="GCT Hostel Link"
                  />
                  <p className="text-xs text-muted-foreground">Shown in navbar, sidebar, browser tab</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Site Subtitle</label>
                  <Input
                    value={settings.siteSubtitle}
                    onChange={(e) => updateSettings({ siteSubtitle: e.target.value })}
                    placeholder="TEVTA Taxila"
                  />
                  <p className="text-xs text-muted-foreground">Shown below the site name</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Logo Image</label>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-2xl">🏢</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={logoUploading}
                        />
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            {logoUploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                            {logoUploading ? "Uploading..." : "Upload Logo"}
                          </span>
                        </Button>
                      </label>
                      {settings.logoUrl && (
                        <Button variant="outline" size="sm" onClick={() => updateSettings({ logoUrl: "" })}>
                          Remove
                        </Button>
                      )}
                    </div>
                    <Input
                      value={settings.logoUrl}
                      onChange={(e) => updateSettings({ logoUrl: e.target.value })}
                      placeholder="Or paste image URL here…"
                      className="text-xs"
                    />
                    <p className="text-xs text-muted-foreground">Max 3 MB. PNG or SVG recommended. If empty, the building icon is used.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card className="border border-border">
            <CardContent className="p-5">
              <h2 className="text-xs font-semibold text-muted-foreground mb-3">LIVE PREVIEW — Navbar Logo</h2>
              <div className="bg-background border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {settings.logoUrl
                    ? <img src={settings.logoUrl} alt="" className="w-full h-full object-contain" />
                    : <span className="text-white text-lg">🏢</span>}
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm leading-tight">{settings.siteName || "GCT Hostel Link"}</div>
                  <div className="text-xs text-muted-foreground">{settings.siteSubtitle || "TEVTA Taxila"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── COLORS TAB ─────────────────────────────────────── */}
        <TabsContent value="colors" className="space-y-4">
          <Card className="border border-border">
            <CardContent className="p-5 space-y-5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Palette className="w-4 h-4" /> Color Theme Presets
              </h2>
              <p className="text-xs text-muted-foreground">
                Choose a preset theme. Changes apply instantly — click Preview to see the full site.
                Remember to click Save All when happy.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {COLOR_THEMES.map((theme) => {
                  const isActive = settings.primaryColor === theme.primaryColor &&
                    settings.heroGradFrom === theme.heroGradFrom;
                  return (
                    <button
                      key={theme.name}
                      onClick={() => updateSettings({
                        primaryColor: theme.primaryColor,
                        sidebarBg: theme.sidebarBg,
                        heroGradFrom: theme.heroGradFrom,
                        heroGradTo: theme.heroGradTo,
                        ctaGradFrom: theme.ctaGradFrom,
                        ctaGradTo: theme.ctaGradTo,
                        accentColor: theme.accentColor,
                        badgeTextColor: theme.badgeTextColor,
                      })}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        isActive
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{theme.emoji}</span>
                        {isActive && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                      </div>
                      <div
                        className="h-6 rounded-lg mb-2"
                        style={{ background: `linear-gradient(to right, ${theme.ctaGradFrom}, ${theme.ctaGradTo})` }}
                      />
                      <div
                        className="h-4 rounded mb-2"
                        style={{ background: theme.heroGradFrom }}
                      />
                      <div className="text-xs font-medium text-foreground">{theme.name}</div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Custom Color Overrides</h2>
              <p className="text-xs text-muted-foreground">
                Fine-tune individual gradient colors for the hero and CTA sections.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Hero Background — Start</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={settings.heroGradFrom}
                      onChange={(e) => updateSettings({ heroGradFrom: e.target.value })}
                      className="h-9 w-12 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={settings.heroGradFrom}
                      onChange={(e) => updateSettings({ heroGradFrom: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Hero Background — End</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={settings.heroGradTo}
                      onChange={(e) => updateSettings({ heroGradTo: e.target.value })}
                      className="h-9 w-12 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={settings.heroGradTo}
                      onChange={(e) => updateSettings({ heroGradTo: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">CTA Section — Start</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={settings.ctaGradFrom}
                      onChange={(e) => updateSettings({ ctaGradFrom: e.target.value })}
                      className="h-9 w-12 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={settings.ctaGradFrom}
                      onChange={(e) => updateSettings({ ctaGradFrom: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">CTA Section — End</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={settings.ctaGradTo}
                      onChange={(e) => updateSettings({ ctaGradTo: e.target.value })}
                      className="h-9 w-12 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={settings.ctaGradTo}
                      onChange={(e) => updateSettings({ ctaGradTo: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Accent / Button Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => updateSettings({ accentColor: e.target.value })}
                      className="h-9 w-12 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={settings.accentColor}
                      onChange={(e) => updateSettings({ accentColor: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Badge Text Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={settings.badgeTextColor}
                      onChange={(e) => updateSettings({ badgeTextColor: e.target.value })}
                      className="h-9 w-12 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={settings.badgeTextColor}
                      onChange={(e) => updateSettings({ badgeTextColor: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Gradient preview */}
              <div className="mt-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Live Gradient Preview</label>
                <div
                  className="h-12 rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${settings.heroGradFrom}, ${settings.heroGradTo})` }}
                />
                <div
                  className="h-8 rounded-xl mt-2"
                  style={{ background: `linear-gradient(to right, ${settings.ctaGradFrom}, ${settings.ctaGradTo})` }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HERO TAB ───────────────────────────────────────── */}
        <TabsContent value="hero" className="space-y-4">
          <Card className="border border-border">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Hero Section Content</h2>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Top Badge Text</label>
                <Input
                  value={settings.heroBadge}
                  onChange={(e) => updateSettings({ heroBadge: e.target.value })}
                  placeholder="GCT TEVTA Hostel, Taxila"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Main Title (White)</label>
                  <Input
                    value={settings.heroTitle}
                    onChange={(e) => updateSettings({ heroTitle: e.target.value })}
                    placeholder="Hostel Management"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Highlight Title (Gradient)</label>
                  <Input
                    value={settings.heroTitleHighlight}
                    onChange={(e) => updateSettings({ heroTitleHighlight: e.target.value })}
                    placeholder="Made Digital"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Hero Subtitle Paragraph</label>
                <Textarea
                  value={settings.heroSubtitle}
                  onChange={(e) => updateSettings({ heroSubtitle: e.target.value })}
                  rows={3}
                  placeholder="Describe your hostel system…"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Sign Up Button Label</label>
                  <Input
                    value={settings.heroCtaSignup}
                    onChange={(e) => updateSettings({ heroCtaSignup: e.target.value })}
                    placeholder="Student Sign Up"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Login Button Label</label>
                  <Input
                    value={settings.heroCtaLogin}
                    onChange={(e) => updateSettings({ heroCtaLogin: e.target.value })}
                    placeholder="Login to Dashboard"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Bottom CTA Section</h2>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">CTA Heading</label>
                <Input
                  value={settings.ctaTitle}
                  onChange={(e) => updateSettings({ ctaTitle: e.target.value })}
                  placeholder="Ready to Get Started?"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">CTA Subtitle</label>
                <Textarea
                  value={settings.ctaSubtitle}
                  onChange={(e) => updateSettings({ ctaSubtitle: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── STATS & FEATURES TAB ───────────────────────────── */}
        <TabsContent value="stats" className="space-y-4">
          {/* Stats */}
          <Card className="border border-border">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Statistics Strip (4 items)</h2>
              <div className="space-y-3">
                {settings.stats.map((stat, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/40 border border-border">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Value</label>
                      <Input
                        value={stat.value}
                        onChange={(e) => updateStat(i, "value", e.target.value)}
                        placeholder="500+"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Label</label>
                      <Input
                        value={stat.label}
                        onChange={(e) => updateStat(i, "label", e.target.value)}
                        placeholder="Students"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Sub-label</label>
                      <Input
                        value={stat.sub}
                        onChange={(e) => updateStat(i, "sub", e.target.value)}
                        placeholder="Jinnah & Iqbal"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="border border-border">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Feature Cards (6 items)</h2>
              <div className="space-y-4">
                {settings.features.map((feat, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Card {i + 1}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Icon</label>
                        <select
                          value={feat.iconKey}
                          onChange={(e) => updateFeature(i, "iconKey", e.target.value)}
                          className="w-full border border-input rounded-lg px-2 py-1.5 text-sm bg-background text-foreground"
                        >
                          {ICON_OPTIONS.map((o) => (
                            <option key={o.key} value={o.key}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Icon Color</label>
                        <select
                          value={feat.color}
                          onChange={(e) => updateFeature(i, "color", e.target.value)}
                          className="w-full border border-input rounded-lg px-2 py-1.5 text-sm bg-background text-foreground"
                        >
                          {COLOR_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Title</label>
                      <Input
                        value={feat.title}
                        onChange={(e) => updateFeature(i, "title", e.target.value)}
                        placeholder="Feature title"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Description</label>
                      <Textarea
                        value={feat.desc}
                        onChange={(e) => updateFeature(i, "desc", e.target.value)}
                        rows={2}
                        className="text-sm"
                        placeholder="Feature description…"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CONTACT TAB ────────────────────────────────────── */}
        <TabsContent value="contact" className="space-y-4">
          <Card className="border border-border">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Footer Contact Information</h2>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Footer Tagline / Description</label>
                <Textarea
                  value={settings.footerTagline}
                  onChange={(e) => updateSettings({ footerTagline: e.target.value })}
                  rows={3}
                  placeholder="Describe your institution…"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
                  <Input
                    value={settings.footerPhone}
                    onChange={(e) => updateSettings({ footerPhone: e.target.value })}
                    placeholder="+92-51-1234567"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                  <Input
                    value={settings.footerEmail}
                    onChange={(e) => updateSettings({ footerEmail: e.target.value })}
                    placeholder="info@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Address</label>
                <Input
                  value={settings.footerAddress}
                  onChange={(e) => updateSettings({ footerAddress: e.target.value })}
                  placeholder="Full address..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Footer preview */}
          <Card className="border border-border">
            <CardContent className="p-5">
              <h2 className="text-xs font-semibold text-muted-foreground mb-3">PREVIEW — Footer Info Block</h2>
              <div className="bg-sidebar rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br flex-shrink-0 overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${settings.ctaGradFrom}, ${settings.ctaGradTo})` }}>
                    {settings.logoUrl
                      ? <img src={settings.logoUrl} alt="" className="w-full h-full object-contain" />
                      : <div className="w-full h-full flex items-center justify-center text-lg">🏢</div>}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{settings.siteName}</div>
                    <div className="text-xs text-sidebar-foreground/70">{settings.siteSubtitle}</div>
                  </div>
                </div>
                <p className="text-xs text-sidebar-foreground/70 leading-relaxed">{settings.footerTagline}</p>
                <div className="text-xs text-sidebar-foreground/70">📍 {settings.footerAddress}</div>
                <div className="text-xs text-sidebar-foreground/70">📞 {settings.footerPhone}</div>
                <div className="text-xs text-sidebar-foreground/70">✉️ {settings.footerEmail}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky save bar for bottom of page */}
      <div className="mt-8 p-4 bg-muted/50 border border-border rounded-xl flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          All changes above preview in real-time.
          Click <strong>Save All</strong> to persist to database and apply for all users.
        </p>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white flex-shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>
    </div>
  );
}
