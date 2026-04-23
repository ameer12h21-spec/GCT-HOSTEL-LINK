import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Users, DollarSign, MessageSquare, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { NetworkWarningBanner } from "@/components/NetworkIndicator";

interface Stats {
  totalStudents: number;
  pendingApprovals: number;
  totalTeachers: number;
  totalMessOwners: number;
  unpaidFees: number;
  openComplaints: number;
}

export default function AdminHome() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0, pendingApprovals: 0, totalTeachers: 0,
    totalMessOwners: 0, unpaidFees: 0, openComplaints: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStats = useCallback(async () => {
    const [studentsRes, pendingRes, teachersRes, messRes, complaintsRes, feesRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact" }).eq("role", "student").eq("status", "active"),
      supabase.from("profiles").select("id", { count: "exact" }).eq("role", "student").eq("status", "pending"),
      supabase.from("profiles").select("id", { count: "exact" }).eq("role", "teacher"),
      supabase.from("profiles").select("id", { count: "exact" }).eq("role", "mess_owner"),
      supabase.from("complaints").select("id", { count: "exact" }).eq("status", "open"),
      supabase.from("mess_fees").select("id", { count: "exact" }).eq("status", "unpaid"),
    ]);
    setStats({
      totalStudents: studentsRes.count || 0,
      pendingApprovals: pendingRes.count || 0,
      totalTeachers: teachersRes.count || 0,
      totalMessOwners: messRes.count || 0,
      unpaidFees: feesRes.count || 0,
      openComplaints: complaintsRes.count || 0,
    });
    setLoading(false);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    loadStats();
    // Real-time: update stats on any relevant table change
    const ch = supabase.channel("admin_home_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => loadStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => loadStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "mess_fees" }, () => loadStats())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadStats]);

  const statCards = [
    { icon: Users, label: "Active Students", value: stats.totalStudents, color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Clock, label: "Pending Approvals", value: stats.pendingApprovals, color: "text-orange-500", bg: "bg-orange-500/10", alert: stats.pendingApprovals > 0 },
    { icon: Users, label: "Teachers", value: stats.totalTeachers, color: "text-green-500", bg: "bg-green-500/10" },
    { icon: Users, label: "Mess Owners", value: stats.totalMessOwners, color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: DollarSign, label: "Unpaid Fees", value: stats.unpaidFees, color: "text-red-500", bg: "bg-red-500/10", alert: stats.unpaidFees > 0 },
    { icon: MessageSquare, label: "Open Complaints", value: stats.openComplaints, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  ];

  return (
    <div>
      <NetworkWarningBanner />
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back, Administrator — here's your hostel at a glance.</p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <RefreshCw className="w-3 h-3" />
            Live · {lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        )}
      </div>

      {stats.pendingApprovals > 0 && (
        <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-orange-500" />
          <div>
            <p className="font-semibold text-foreground text-sm">{stats.pendingApprovals} student{stats.pendingApprovals > 1 ? "s" : ""} awaiting approval</p>
            <p className="text-xs text-muted-foreground">Go to Students Management to review and approve.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`border ${s.alert ? "border-orange-500/40" : "border-border"}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{loading ? "—" : s.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border">
          <CardHeader><CardTitle className="text-base">System Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "System", value: "GCT Hostel Link" },
              { label: "Institution", value: "GCT TEVTA Taxila" },
              { label: "Hostels", value: "Jinnah Hostel, Iqbal Hostel" },
              { label: "Shifts", value: "1st (Morning), 2nd (Evening)" },
              { label: "Currency", value: "PKR (Pakistani Rupee)" },
              { label: "Developer", value: "Ameer Hamza Arshad" },
            ].map((info) => (
              <div key={info.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{info.label}</span>
                <span className="text-sm font-medium text-foreground">{info.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Approve Students", href: "/admin/students", color: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600" },
                { label: "Mark Attendance", href: "/admin/attendance", color: "bg-green-500/10 hover:bg-green-500/20 text-green-600" },
                { label: "Manage Fees", href: "/admin/mess-fees", color: "bg-orange-500/10 hover:bg-orange-500/20 text-orange-600" },
                { label: "View Complaints", href: "/admin/complaints", color: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600" },
                { label: "Add Staff", href: "/admin/staff", color: "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600" },
                { label: "Admissions", href: "/admin/admissions", color: "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600" },
              ].map((action) => (
                <Link key={action.label} href={action.href}
                  className={`${action.color} rounded-lg p-3 text-sm font-medium transition-colors text-center block`}>
                  {action.label}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
