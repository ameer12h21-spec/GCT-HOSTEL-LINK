import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { NetworkWarningBanner } from "@/components/NetworkIndicator";
import {
  CalendarCheck, DollarSign, Zap, MessageSquare,
  User, Phone, Mail, Home, ChevronRight, AlertCircle,
  TrendingUp, ShieldCheck, Wifi, WifiOff,
} from "lucide-react";
import { formatPKR } from "@/lib/utils";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface Summary {
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  messFee: any;
  electricityBill: any;
  openComplaints: number;
}

export default function StudentHome() {
  const { profile } = useAuth();
  const net = useNetworkStatus();
  const [summary, setSummary] = useState<Summary>({
    presentCount: 0, absentCount: 0, leaveCount: 0,
    messFee: null, electricityBill: null, openComplaints: 0,
  });
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async (isRetry = false) => {
    if (!profile) return;
    if (isRetry) setRetrying(true);
    setLoadError(false);
    const month = new Date().toISOString().slice(0, 7);
    try {
      const [attendanceRes, messRes, elecRes, complaintsRes] = await Promise.all([
        supabase.from("attendance").select("status").eq("student_id", profile.id).gte("date", `${month}-01`),
        supabase.from("mess_fees").select("*").eq("student_id", profile.id).eq("month", month).maybeSingle(),
        supabase.from("electricity_bills").select("*").eq("student_id", profile.id).eq("month", month).maybeSingle(),
        supabase.from("complaints").select("id", { count: "exact" }).eq("student_id", profile.id).eq("status", "open"),
      ]);
      if (attendanceRes.error || messRes.error || elecRes.error || complaintsRes.error) {
        throw new Error("Fetch failed");
      }
      const att = attendanceRes.data || [];
      setSummary({
        presentCount: att.filter((a) => a.status === "present").length,
        absentCount: att.filter((a) => a.status === "absent").length,
        leaveCount: att.filter((a) => a.status === "leave").length,
        messFee: messRes.data,
        electricityBill: elecRes.data,
        openComplaints: complaintsRes.count || 0,
      });
      setLastUpdated(new Date());
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    load();
    const ch = supabase.channel("student_home_rt_" + profile.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "mess_fees", filter: `student_id=eq.${profile.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "electricity_bills", filter: `student_id=eq.${profile.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance", filter: `student_id=eq.${profile.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints", filter: `student_id=eq.${profile.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile, load]);

  if (!profile) return null;

  const totalDays = summary.presentCount + summary.absentCount + summary.leaveCount;
  const attendancePct = totalDays > 0 ? Math.round((summary.presentCount / totalDays) * 100) : 0;
  const initials = profile.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
  const today = new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-5 pb-6">
      <NetworkWarningBanner />

      {loadError && (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Could not load data. Check your connection.</span>
          </div>
          <button onClick={() => load(true)} disabled={retrying}
            className="text-xs font-semibold underline hover:no-underline disabled:opacity-50">
            {retrying ? "Retrying…" : "Retry"}
          </button>
        </div>
      )}

      {/* ── Profile Hero Card ── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-5 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-6 -mb-6" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold shadow-inner flex-shrink-0 overflow-hidden border-2 border-white/30">
            {profile.profile_photo_url
              ? <img src={profile.profile_photo_url} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight">{profile.name}</h1>
            <p className="text-sm text-blue-100">{profile.roll_number} · {profile.technology}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs bg-white/20 rounded-full px-2.5 py-0.5">{profile.hostel} Hostel</span>
              <span className="text-xs bg-white/20 rounded-full px-2.5 py-0.5">Room {profile.room_no}</span>
              <span className="text-xs bg-white/20 rounded-full px-2.5 py-0.5">Shift {profile.shift}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {lastUpdated ? (
              <span className="text-xs text-blue-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Live
              </span>
            ) : null}
            {net.quality === "offline"
              ? <WifiOff className="w-4 h-4 text-red-300" />
              : <Wifi className={`w-4 h-4 ${net.quality === "very-high" || net.quality === "high" ? "text-green-300" : "text-yellow-300"}`} />}
          </div>
        </div>
        <p className="relative text-xs text-blue-200 mt-3">{today}</p>
      </div>

      {/* ── Financial Status Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Mess Fee */}
        <Card className={`border-2 ${summary.messFee?.status === "paid" ? "border-green-500/40 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${summary.messFee?.status === "paid" ? "bg-green-500/15" : "bg-red-500/15"}`}>
                    <DollarSign className={`w-4 h-4 ${summary.messFee?.status === "paid" ? "text-green-600" : "text-red-600"}`} />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Mess Fee</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {summary.messFee ? formatPKR(Number(summary.messFee.amount)) : <span className="text-lg text-muted-foreground">Not Set</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date().toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
                </p>
              </div>
              <Badge className={`text-xs font-semibold capitalize ${summary.messFee?.status === "paid"
                ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40"
                : "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40"}`}>
                {summary.messFee?.status || "Unpaid"}
              </Badge>
            </div>
            {summary.messFee?.paid_at && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Paid on {new Date(summary.messFee.paid_at).toLocaleDateString("en-PK")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Electricity Bill */}
        <Card className={`border-2 ${summary.electricityBill?.status === "paid" ? "border-green-500/40 bg-green-500/5" : summary.electricityBill ? "border-orange-500/30 bg-orange-500/5" : "border-border"}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${summary.electricityBill?.status === "paid" ? "bg-green-500/15" : "bg-yellow-500/15"}`}>
                    <Zap className={`w-4 h-4 ${summary.electricityBill?.status === "paid" ? "text-green-600" : "text-yellow-600"}`} />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Electricity</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {summary.electricityBill ? formatPKR(Number(summary.electricityBill.amount)) : <span className="text-lg text-muted-foreground">Not Set</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date().toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
                </p>
              </div>
              <Badge className={`text-xs font-semibold capitalize ${summary.electricityBill?.status === "paid"
                ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40"
                : summary.electricityBill
                ? "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/40"
                : "bg-muted text-muted-foreground border-border"}`}>
                {summary.electricityBill?.status || "Pending"}
              </Badge>
            </div>
            {summary.electricityBill?.paid_at && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Paid on {new Date(summary.electricityBill.paid_at).toLocaleDateString("en-PK")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Attendance + Complaints ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Attendance */}
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm font-semibold text-foreground">This Month</span>
              </div>
              <span className={`text-lg font-bold ${attendancePct >= 75 ? "text-green-600" : attendancePct >= 50 ? "text-orange-500" : "text-red-600"}`}>
                {loading ? "—" : `${attendancePct}%`}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${attendancePct >= 75 ? "bg-green-500" : attendancePct >= 50 ? "bg-orange-500" : "bg-red-500"}`}
                style={{ width: loading ? "0%" : `${attendancePct}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-500/10 rounded-lg p-2">
                <p className="text-xl font-bold text-green-600">{loading ? "—" : summary.presentCount}</p>
                <p className="text-[10px] text-muted-foreground">Present</p>
              </div>
              <div className="bg-red-500/10 rounded-lg p-2">
                <p className="text-xl font-bold text-red-600">{loading ? "—" : summary.absentCount}</p>
                <p className="text-[10px] text-muted-foreground">Absent</p>
              </div>
              <div className="bg-yellow-500/10 rounded-lg p-2">
                <p className="text-xl font-bold text-yellow-600">{loading ? "—" : summary.leaveCount}</p>
                <p className="text-[10px] text-muted-foreground">Leave</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complaints */}
        <Card className={`border ${summary.openComplaints > 0 ? "border-purple-500/40 bg-purple-500/5" : "border-border"}`}>
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-sm font-semibold text-foreground">My Complaints</span>
            </div>
            <div className="text-center py-2">
              <p className={`text-5xl font-bold ${summary.openComplaints > 0 ? "text-purple-600" : "text-foreground"}`}>
                {loading ? "—" : summary.openComplaints}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Open complaint{summary.openComplaints !== 1 ? "s" : ""}</p>
            </div>
            <Link href="/student/complaints"
              className="flex items-center justify-center gap-1 text-xs text-primary font-medium hover:underline mt-2">
              {summary.openComplaints > 0 ? "View & Track" : "Submit Complaint"}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Chat Teacher", href: "/student/chat", icon: MessageSquare, from: "from-blue-500", to: "to-indigo-600" },
            { label: "My Fees", href: "/student/mess-fees", icon: DollarSign, from: "from-orange-500", to: "to-pink-600" },
            { label: "Electricity", href: "/student/electricity", icon: Zap, from: "from-yellow-500", to: "to-orange-600" },
            { label: "Complaints", href: "/student/complaints", icon: TrendingUp, from: "from-purple-500", to: "to-violet-600" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br ${action.from} ${action.to} text-white shadow-sm hover:shadow-md hover:scale-[1.02] transition-all active:scale-[0.98]`}>
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Profile Details ── */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />My Profile
          </p>
          <div className="space-y-0 divide-y divide-border">
            {[
              { icon: User, label: "Roll Number", value: profile.roll_number },
              { icon: Home, label: "Room & Hostel", value: `Room ${profile.room_no} · ${profile.hostel} Hostel` },
              { icon: TrendingUp, label: "Technology", value: profile.technology },
              { icon: Mail, label: "Email", value: profile.email },
              { icon: Phone, label: "Phone", value: profile.phone },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <span className="text-xs font-medium text-foreground text-right truncate max-w-[55%]">{value || "—"}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
