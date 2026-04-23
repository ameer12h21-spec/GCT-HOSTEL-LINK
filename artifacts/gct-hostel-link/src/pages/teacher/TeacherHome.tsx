import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { NetworkWarningBanner } from "@/components/NetworkIndicator";
import {
  Users, CalendarCheck, Zap, MessageSquare,
  AlertCircle, ChevronRight, BookOpen, MessageCircle,
  TrendingUp, CheckCircle2, Activity,
} from "lucide-react";

interface Stats {
  students: number;
  todayAttendance: number;
  presentToday: number;
  openComplaints: number;
  billsSet: number;
}

export default function TeacherHome() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ students: 0, todayAttendance: 0, presentToday: 0, openComplaints: 0, billsSet: 0 });
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (isRetry = false) => {
    if (isRetry) setRetrying(true);
    setLoadError(false);
    try {
      const today = new Date().toISOString().split("T")[0];
      const month = new Date().toISOString().slice(0, 7);
      const [studentsRes, attendanceAllRes, attendancePresentRes, complaintsRes, billsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }).eq("role", "student").eq("status", "active"),
        supabase.from("attendance").select("id", { count: "exact" }).eq("date", today),
        supabase.from("attendance").select("id", { count: "exact" }).eq("date", today).eq("status", "present"),
        supabase.from("complaints").select("id", { count: "exact" }).eq("status", "open"),
        supabase.from("electricity_bills").select("id", { count: "exact" }).eq("month", month),
      ]);
      if (studentsRes.error || complaintsRes.error || billsRes.error) throw new Error("Fetch failed");
      setStats({
        students: studentsRes.count || 0,
        todayAttendance: attendanceAllRes.count || 0,
        presentToday: attendancePresentRes.count || 0,
        openComplaints: complaintsRes.count || 0,
        billsSet: billsRes.count || 0,
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
    const ch = supabase.channel("teacher_home_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "electricity_bills" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const attendancePct = stats.students > 0 ? Math.round((stats.presentToday / stats.students) * 100) : 0;
  const today = new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const initials = (profile?.name || "T").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

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

      {/* ── Hero Header ── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-5 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-6 -mb-6" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold border-2 border-white/30 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight">Welcome, {profile?.name?.split(" ")[0]}</h1>
            <p className="text-sm text-emerald-100">Teacher · GCT TEVTA Taxila</p>
            <p className="text-xs text-emerald-200 mt-1">{today}</p>
          </div>
          {lastUpdated && (
            <span className="text-xs text-emerald-200 flex items-center gap-1 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />Live
            </span>
          )}
        </div>
      </div>

      {/* ── Attendance Overview ── */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Today's Attendance</p>
                <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" })}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${attendancePct >= 75 ? "text-green-600" : attendancePct >= 50 ? "text-orange-500" : "text-red-600"}`}>
                {loading ? "—" : `${attendancePct}%`}
              </p>
              <p className="text-xs text-muted-foreground">{loading ? "" : `${stats.presentToday} / ${stats.students} present`}</p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${attendancePct >= 75 ? "bg-green-500" : attendancePct >= 50 ? "bg-orange-500" : "bg-red-500"}`}
              style={{ width: loading ? "0%" : `${attendancePct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.todayAttendance === 0
              ? "Attendance not marked yet for today."
              : `${stats.todayAttendance} student(s) marked — ${stats.students - stats.todayAttendance} remaining`}
          </p>
        </CardContent>
      </Card>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Students</p>
                <p className="text-3xl font-bold text-foreground">{loading ? "—" : stats.students}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border ${stats.openComplaints > 0 ? "border-purple-500/30 bg-purple-500/5" : "border-border"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Open Complaints</p>
                <p className={`text-3xl font-bold ${stats.openComplaints > 0 ? "text-purple-600" : "text-foreground"}`}>
                  {loading ? "—" : stats.openComplaints}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bills Set (Month)</p>
                <p className="text-3xl font-bold text-foreground">{loading ? "—" : stats.billsSet}</p>
                {!loading && stats.billsSet < stats.students && (
                  <p className="text-[10px] text-orange-500">{stats.students - stats.billsSet} pending</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Marked Today</p>
                <p className="text-3xl font-bold text-foreground">{loading ? "—" : stats.todayAttendance}</p>
                {!loading && stats.todayAttendance === 0 && (
                  <p className="text-[10px] text-orange-500">Not marked yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Mark Attendance", href: "/teacher/attendance", icon: CalendarCheck, from: "from-green-500", to: "to-emerald-600", desc: "Daily record" },
            { label: "Electricity Bills", href: "/teacher/electricity", icon: Zap, from: "from-yellow-500", to: "to-orange-600", desc: "Set monthly bills" },
            { label: "Chat with Students", href: "/teacher/chat", icon: MessageCircle, from: "from-blue-500", to: "to-indigo-600", desc: "WhatsApp-style" },
            { label: "View Complaints", href: "/teacher/complaints", icon: TrendingUp, from: "from-purple-500", to: "to-violet-600", desc: `${stats.openComplaints} open` },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}
                className={`flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br ${action.from} ${action.to} text-white shadow-sm hover:shadow-md hover:scale-[1.02] transition-all active:scale-[0.98]`}>
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{action.label}</p>
                  <p className="text-xs text-white/70">{action.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto opacity-70 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── System Info ── */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" />System Info
          </p>
          <div className="divide-y divide-border">
            {[
              ["Institution", "GCT TEVTA Taxila"],
              ["Hostels", "Jinnah & Iqbal Hostel"],
              ["Academic Shifts", "Morning & Evening"],
              ["Currency", "PKR (Pakistani Rupee)"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 text-xs">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
