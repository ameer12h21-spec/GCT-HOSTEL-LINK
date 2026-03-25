import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, CalendarCheck, DollarSign, Zap,
  MessageSquare, Shield, ChevronRight, Star, BookOpen,
  CheckCircle2
} from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

// Icon map for feature cards — driven by iconKey stored in settings
const ICON_MAP: Record<string, React.ElementType> = {
  users: Users,
  calendar: CalendarCheck,
  dollar: DollarSign,
  zap: Zap,
  message: MessageSquare,
  shield: Shield,
  building: Building2,
  book: BookOpen,
  star: Star,
  check: CheckCircle2,
};

export default function LandingPage() {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ── Hero Section ──────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20 sm:py-28"
        style={{
          background: `linear-gradient(135deg, ${settings.heroGradFrom} 0%, ${settings.heroGradTo} 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bTEyIDEydjZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==")`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge
            className="mb-6 px-4 py-1.5 text-sm border"
            style={{
              backgroundColor: `${settings.accentColor}22`,
              color: settings.badgeTextColor,
              borderColor: `${settings.accentColor}44`,
            }}
          >
            {settings.heroBadge}
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            {settings.heroTitle}
            <span
              className="block text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(to right, ${settings.accentColor}, ${settings.badgeTextColor})`,
              }}
            >
              {settings.heroTitleHighlight}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/75 max-w-3xl mx-auto mb-10 leading-relaxed">
            {settings.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="text-white border-none px-8 py-3 text-base font-semibold shadow-lg"
                style={{ background: `linear-gradient(to right, ${settings.ctaGradFrom}, ${settings.ctaGradTo})` }}
              >
                {settings.heroCtaSignup} <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-base">
                {settings.heroCtaLogin}
              </Button>
            </Link>
          </div>
          <div className="mt-6">
            <Link href="/admissions">
              <Button variant="ghost" className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 font-semibold">
                <BookOpen className="w-4 h-4 mr-2" />
                New Admissions — Apply Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ───────────────────────────────────── */}
      <section className="py-12 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {settings.stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{s.value}</div>
                <div className="text-sm font-semibold text-foreground">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete digital management system designed specifically for government hostel operations.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {settings.features.map((f) => {
              const Icon = ICON_MAP[f.iconKey] || Shield;
              return (
                <Card key={f.title} className="border border-border hover:border-primary/40 transition-all hover:shadow-md group">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────── */}
      <section
        className="py-16"
        style={{ background: `linear-gradient(135deg, ${settings.ctaGradFrom}, ${settings.ctaGradTo})` }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{settings.ctaTitle}</h2>
          <p className="text-white/80 mb-8 text-lg">{settings.ctaSubtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white font-semibold px-8" style={{ color: settings.ctaGradFrom }}>
                Student Sign Up
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 px-8">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
