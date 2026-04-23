import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { NetworkWarningBanner } from "@/components/NetworkIndicator";
import {
  DollarSign, CheckCircle, XCircle, Users,
  ChevronRight, AlertCircle, TrendingUp,
  Clock, ShieldCheck, Activity,
} from "lucide-react";
import { formatPKR } from "@/lib/utils";

interface MessStats {
  totalStudents: number;
  paid: number;
  unpaid: number;
  totalCollected: number;
  pendingAmount: number;
  avgFee: number;
}

export default function MessOwnerHome() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<MessStats>({ totalStudents: 0, paid: 0, unpaid: 0, totalCollected: 0, pendingAmount: 0, avgFee: 0 });
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (isRetry = false) => {
    if (isRetry) setRetrying(true);
    setLoadError(false);
    try {
      const month = new Date().toISOString().slice(0, 7);
      const [studentsRes, feesRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }).eq("role", "student").eq("status", "active"),
        supabase.from("mess_fees").select("status, amount").eq("month", month),
      ]);
      if (studentsRes.error || feesRes.error) throw new Error("Fetch failed");
      const fees = feesRes.data || [];
      const paid = fees.filter((f) => f.status === "paid");
      const unpaid = fees.filter((f) => f.status !== "paid");
      const totalCollected = paid.reduce((sum, f) => sum + Number(f.amount), 0);
      const pendingAmount = unpaid.reduce((sum, f) => sum + Number(f.amount), 0);
      const avgFee = fees.length > 0 ? Math.round(fees.reduce((s, f) => s + Number(f.amount), 0) / fees.length) : 0;
      setStats({
        totalStudents: studentsRes.count || 0,
        paid: paid.length,
        unpaid: unpaid.length,
        totalCollected,
        pendingAmount,
        avgFee,
      });
      setLastUpdated(new Date());
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel("mess_owner_home_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "mess_fees" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const collectionRate = stats.paid + stats.unpaid > 0
    ? Math.round((stats.paid / (stats.paid + stats.unpaid)) * 100) : 0;
  const today = new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const monthName = new Date().toLocaleDateString("en-PK", { month: "long", year: "numeric" });
  const initials = (profile?.name || "M").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-5 pb-6">
      <NetworkWarningBanner />

      {loadError && (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Could not load data. Check your connection.</span>
          </div>
          <button onClick={() => load(true)} disabled={retrying}
            className="text-xs font-semibold underline hover:no-underline disabled:opacity-50">
            {retrying ? "Retrying…" : "Retry"}
          </button>
        </div>
      )}

      {/* ── Hero Card ── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600 p-5 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-6 -mb-6" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold border-2 border-white/30 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight">Welcome, {profile?.name?.split(" ")[0]}</h1>
            <p className="text-sm text-orange-100">Mess Owner · GCT TEVTA Taxila</p>
            <p className="text-xs text-orange-200 mt-1">{today}</p>
          </div>
          {lastUpdated && (
            <span className="text-xs text-orange-200 flex items-center gap-1 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />Live
            </span>
          )}
        </div>
        {/* Collection summary in hero */}
        <div className="relative mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-3">
          <p className="text-xs text-orange-100 mb-1">Collection Rate — {monthName}</p>
          <div className="w-full bg-white/20 rounded-full h-2 mb-2">
            <div className="h-2 rounded-full bg-white transition-all duration-700"
              style={{ width: loading ? "0%" : `${collectionRate}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/80">{loading ? "—" : `${stats.paid} paid / ${stats.paid + stats.unpaid} billed`}</span>
            <span className="font-bold text-white">{loading ? "—" : `${collectionRate}%`}</span>
          </div>
        </div>
      </div>

      {/* ── Revenue Summary ── */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-2 border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Collected</span>
            </div>
            <p className="text-xl font-bold text-green-600">{loading ? "—" : formatPKR(stats.totalCollected)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{loading ? "" : `${stats.paid} student(s) paid`}</p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${stats.unpaid > 0 ? "border-red-500/30 bg-red-500/5" : "border-border"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats.unpaid > 0 ? "bg-red-500/15" : "bg-muted"}`}>
                <Clock className={`w-4 h-4 ${stats.unpaid > 0 ? "text-red-600" : "text-muted-foreground"}`} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Pending</span>
            </div>
            <p className={`text-xl font-bold ${stats.unpaid > 0 ? "text-red-600" : "text-foreground"}`}>
              {loading ? "—" : formatPKR(stats.pendingAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{loading ? "" : `${stats.unpaid} student(s) pending`}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center mx-auto mb-1">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-foreground">{loading ? "—" : stats.totalStudents}</p>
            <p className="text-[10px] text-muted-foreground">Students</p>
          </CardContent>
        </Card>

        <Card className="border border-green-500/20 bg-green-500/5">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center mx-auto mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xl font-bold text-green-600">{loading ? "—" : stats.paid}</p>
            <p className="text-[10px] text-muted-foreground">Paid</p>
          </CardContent>
        </Card>

        <Card className={`border ${stats.unpaid > 0 ? "border-red-500/20 bg-red-500/5" : "border-border"}`}>
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center mx-auto mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className={`text-xl font-bold ${stats.unpaid > 0 ? "text-red-600" : "text-foreground"}`}>{loading ? "—" : stats.unpaid}</p>
            <p className="text-[10px] text-muted-foreground">Unpaid</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Manage Fees", href: "/mess/fees", icon: DollarSign, from: "from-orange-500", to: "to-red-600", desc: `${stats.unpaid} pending payments` },
            { label: "Payment History", href: "/mess/payment-history", icon: Activity, from: "from-green-500", to: "to-emerald-600", desc: `${stats.paid} collected this month` },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}
                className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br ${action.from} ${action.to} text-white shadow-sm hover:shadow-md hover:scale-[1.01] transition-all active:scale-[0.99]`}>
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight">{action.label}</p>
                  <p className="text-xs text-white/70">{action.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Info Card ── */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" />Financial Summary — {monthName}
          </p>
          <div className="divide-y divide-border">
            {[
              ["Total Billed Students", loading ? "—" : `${stats.paid + stats.unpaid}`],
              ["Average Fee", loading ? "—" : formatPKR(stats.avgFee)],
              ["Total Collected", loading ? "—" : formatPKR(stats.totalCollected)],
              ["Total Pending", loading ? "—" : formatPKR(stats.pendingAmount)],
              ["Collection Rate", loading ? "—" : `${collectionRate}%`],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between py-2.5 text-xs">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-semibold text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
