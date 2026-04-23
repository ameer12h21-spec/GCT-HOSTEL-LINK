import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, CalendarCheck, DollarSign, Zap,
  MessageSquare, Shield, ChevronRight, BookOpen,
  CheckCircle2, Lock, RefreshCw, Smartphone, Download,
  Star, ArrowRight, TrendingUp, Clock, Award, Globe,
} from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const ICON_MAP: Record<string, React.ElementType> = {
  users: Users, calendar: CalendarCheck, dollar: DollarSign,
  zap: Zap, message: MessageSquare, shield: Shield,
  building: Building2, book: BookOpen, star: Star, check: CheckCircle2,
};

const coreFeatures = [
  { icon: Users, title: "Role-Based Dashboards", desc: "Separate, purpose-built dashboards for Admin, Teacher, Mess Owner, and Student — each with the exact data and controls they need.", color: "from-blue-500 to-indigo-600", bg: "bg-blue-500/10 text-blue-600" },
  { icon: CalendarCheck, title: "Smart Attendance", desc: "Teachers mark daily attendance. Records auto-lock after 3 days for data integrity. Admins can unlock and audit any record.", color: "from-green-500 to-emerald-600", bg: "bg-green-500/10 text-green-600" },
  { icon: DollarSign, title: "Mess Fee Tracking", desc: "Set global or per-student fees. Record cash payments instantly. Every student sees their payment status in real time — PKR currency.", color: "from-orange-500 to-red-500", bg: "bg-orange-500/10 text-orange-600" },
  { icon: Zap, title: "Electricity Billing", desc: "Teachers assign monthly electricity bills per student. Students view their bill instantly. Export to CSV for record-keeping.", color: "from-yellow-500 to-orange-600", bg: "bg-yellow-500/10 text-yellow-600" },
  { icon: MessageSquare, title: "Complaint System", desc: "Students submit complaints anonymously. Teachers and admin manage, track, and resolve. Full audit trail maintained.", color: "from-purple-500 to-violet-600", bg: "bg-purple-500/10 text-purple-600" },
  { icon: Shield, title: "Bank-Level Security", desc: "Row-level security on all data. Soft-delete with full trash/restore system. End-to-end encryption via Supabase.", color: "from-slate-500 to-slate-700", bg: "bg-slate-500/10 text-slate-600" },
  { icon: RefreshCw, title: "Real-Time Updates", desc: "All data syncs live across all devices using Supabase Realtime — no refresh needed. See changes as they happen.", color: "from-cyan-500 to-blue-600", bg: "bg-cyan-500/10 text-cyan-600" },
  { icon: Smartphone, title: "Mobile First", desc: "Fully responsive on every device — phone, tablet, desktop. Works on 2G/3G with retry logic and offline indicators.", color: "from-pink-500 to-rose-600", bg: "bg-pink-500/10 text-pink-600" },
  { icon: Download, title: "CSV Export", desc: "Export attendance, fees, and electricity data to spreadsheet files with one click. Full data ownership.", color: "from-teal-500 to-cyan-600", bg: "bg-teal-500/10 text-teal-600" },
];

const stats = [
  { icon: Users, value: "500+", label: "Students Managed", sub: "Across both hostels" },
  { icon: Building2, value: "2", label: "Hostel Buildings", sub: "Jinnah & Iqbal Hostel" },
  { icon: CalendarCheck, value: "365", label: "Days of Record", sub: "Attendance tracked daily" },
  { icon: Shield, value: "100%", label: "Data Security", sub: "Row-level access control" },
];

const trustPoints = [
  { icon: Lock, text: "Role-based access — no one sees data they shouldn't" },
  { icon: RefreshCw, text: "Real-time sync — always accurate, never stale" },
  { icon: Clock, text: "Audit trail — every action is logged and traceable" },
  { icon: Globe, text: "Low-connection resilience — works on slow networks" },
];

const roles = [
  { role: "Admin", icon: Award, color: "from-purple-600 to-violet-700", desc: "Full system control, student approvals, audit logs, staff management, site settings.", points: ["Approve student registrations", "View all financial records", "Unlock locked attendance", "Trash & restore system"] },
  { role: "Teacher", icon: CalendarCheck, color: "from-green-600 to-emerald-700", desc: "Daily attendance, electricity billing, complaint management, student overview.", points: ["Mark daily attendance", "Set electricity bills", "Manage complaints", "Chat with students"] },
  { role: "Mess Owner", icon: DollarSign, color: "from-orange-600 to-red-700", desc: "Mess fee management, payment recording, monthly collection tracking.", points: ["Set and adjust fees", "Record cash payments", "View payment history", "Monthly revenue reports"] },
  { role: "Student", icon: TrendingUp, color: "from-blue-600 to-indigo-700", desc: "View attendance, fees, electricity bills, submit complaints, chat with teacher.", points: ["Check attendance record", "View mess fee status", "Track electricity bills", "Submit & track complaints"] },
];

export default function LandingPage() {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32"
        style={{ background: `linear-gradient(135deg, ${settings.heroGradFrom} 0%, ${settings.heroGradTo} 100%)` }}
      >
        {/* Decorative mesh */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bTEyIDEydjZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==")`}} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-16 -mb-16 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 px-4 py-1.5 text-sm border inline-flex items-center gap-2"
              style={{ backgroundColor: `${settings.accentColor}22`, color: settings.badgeTextColor, borderColor: `${settings.accentColor}44` }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {settings.heroBadge}
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
              {settings.heroTitle}
              <span className="block text-transparent bg-clip-text mt-1"
                style={{ backgroundImage: `linear-gradient(to right, ${settings.accentColor}, ${settings.badgeTextColor})` }}>
                {settings.heroTitleHighlight}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/75 max-w-3xl mx-auto mb-10 leading-relaxed">
              {settings.heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link href="/signup">
                <Button size="lg"
                  className="text-white border-none px-8 py-6 text-base font-semibold shadow-lg shadow-black/20 hover:shadow-xl hover:scale-[1.02] transition-all"
                  style={{ background: `linear-gradient(to right, ${settings.ctaGradFrom}, ${settings.ctaGradTo})` }}>
                  {settings.heroCtaSignup} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base backdrop-blur-sm">
                  {settings.heroCtaLogin}
                </Button>
              </Link>
            </div>

            <Link href="/admissions">
              <Button variant="ghost" className="text-orange-300 hover:text-orange-200 hover:bg-orange-500/10 font-semibold">
                <BookOpen className="w-4 h-4 mr-2" />
                New Admissions — Apply Now
              </Button>
            </Link>

            {/* Trust micro-bar */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/60 text-sm">
              {["500+ Students", "Real-time Sync", "100% Secure", "Mobile Ready", "PKR Billing"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />{item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ─────────────────────────────────────── */}
      <section className="py-14 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center group">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-primary">{s.value}</div>
                  <div className="text-sm font-semibold text-foreground mt-1">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Core Features ─────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20">Complete Feature Set</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Everything You Need to Run a Hostel</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
              A purpose-built platform covering every operation — from admission to daily attendance, fees, electricity, and beyond.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {settings.features.length > 0
              ? settings.features.map((f) => {
                  const Icon = ICON_MAP[f.iconKey] || Shield;
                  return (
                    <Card key={f.title} className="border border-border hover:border-primary/40 hover:shadow-md transition-all group cursor-default">
                      <CardContent className="p-6">
                        <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Icon className={`w-5 h-5 ${f.color}`} />
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                      </CardContent>
                    </Card>
                  );
                })
              : coreFeatures.map((f) => {
                  const Icon = f.icon;
                  return (
                    <Card key={f.title} className="border border-border hover:border-primary/40 hover:shadow-md transition-all group cursor-default overflow-hidden">
                      <CardContent className="p-6">
                        <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-5 h-5" />
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

      {/* ── Role Dashboards ───────────────────────────────── */}
      <section className="py-20 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20">Role-Based Access</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">One Platform, Four Roles</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every user sees exactly what they need. No clutter, no confusion — purpose-built screens for each role.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.role} className="bg-background rounded-2xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-md transition-all group">
                  <div className={`bg-gradient-to-br ${r.color} p-5 text-white`}>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg">{r.role}</h3>
                    <p className="text-xs text-white/75 mt-1 leading-snug">{r.desc}</p>
                  </div>
                  <div className="p-4 space-y-2">
                    {r.points.map((pt) => (
                      <div key={pt} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Trust & Security ──────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 px-3 py-1 text-xs bg-green-500/10 text-green-600 border-green-500/20">Security & Reliability</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Built with Precision. Trusted with Data.</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Every financial transaction, attendance record, and personal data point is secured with row-level policies, encrypted at rest, and backed by a complete audit trail. This is not just software — it's infrastructure for institutional trust.
              </p>
              <div className="space-y-4">
                {trustPoints.map((tp) => {
                  const Icon = tp.icon;
                  return (
                    <div key={tp.text} className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-sm text-foreground font-medium">{tp.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, title: "Row-Level Security", desc: "Supabase RLS ensures no user can access another user's data — ever.", color: "text-blue-600", bg: "bg-blue-500/10" },
                { icon: Clock, title: "3-Day Attendance Lock", desc: "Attendance records auto-lock after 3 days, preventing unauthorized edits.", color: "text-purple-600", bg: "bg-purple-500/10" },
                { icon: RefreshCw, title: "Soft-Delete System", desc: "Nothing is permanently lost. All deletions are reversible by admin.", color: "text-orange-600", bg: "bg-orange-500/10" },
                { icon: Award, title: "TEVTA Compliant", desc: "Designed according to GCT TEVTA Taxila's operational procedures.", color: "text-green-600", bg: "bg-green-500/10" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="border border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-5">
                      <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <h3 className="font-semibold text-sm text-foreground mb-1">{item.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why GCT Hostel Link ───────────────────────────── */}
      <section className="py-20 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20">Why This System?</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">From Paper Registers to Real-Time Digital</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              GCT TEVTA Hostel faced the same challenge every institution does — manual records, human error, and zero visibility. GCT Hostel Link solves all of it.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { before: "Paper attendance registers — easily lost, damaged, or forged", after: "Digital attendance with 3-day auto-lock and admin audit log" },
              { before: "Manual fee collection with no payment tracking or history", after: "Real-time PKR fee management with digital receipts and reports" },
              { before: "No way to track electricity bills per student fairly", after: "Per-student monthly electricity billing, visible to all roles instantly" },
            ].map((item, i) => (
              <div key={i} className="bg-background rounded-2xl border border-border p-6 space-y-4">
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
                  <span className="font-semibold block mb-1 text-xs uppercase tracking-wide">Before</span>
                  {item.before}
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-green-600 rotate-90" />
                  </div>
                </div>
                <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-4 text-sm text-green-700 dark:text-green-400">
                  <span className="font-semibold block mb-1 text-xs uppercase tracking-wide">After</span>
                  {item.after}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${settings.ctaGradFrom}, ${settings.ctaGradTo})` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bTEyIDEydjZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==")`}} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{settings.ctaTitle}</h2>
          <p className="text-white/80 mb-10 text-lg max-w-2xl mx-auto leading-relaxed">{settings.ctaSubtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white font-semibold px-8 py-6 text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                style={{ color: settings.ctaGradFrom }}>
                Student Sign Up <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 px-8 py-6 text-base">
                Login to Dashboard
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/50 text-sm">
            {["Free for all students", "No installation required", "Works on any device", "Secure & private"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />{item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
