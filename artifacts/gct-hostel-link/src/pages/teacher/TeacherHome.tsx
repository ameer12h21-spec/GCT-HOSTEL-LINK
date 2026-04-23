import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Users, CalendarCheck, Zap, MessageSquare, RefreshCw } from "lucide-react";

export default function TeacherHome() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ students: 0, todayAttendance: 0, openComplaints: 0, billsSet: 0 });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const month = new Date().toISOString().slice(0, 7);
    const [studentsRes, attendanceRes, complaintsRes, billsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact" }).eq("role", "student").eq("status", "active"),
      supabase.from("attendance").select("id", { count: "exact" }).eq("date", today),
      supabase.from("complaints").select("id", { count: "exact" }).eq("status", "open"),
      supabase.from("electricity_bills").select("id", { count: "exact" }).eq("month", month),
    ]);
    setStats({
      students: studentsRes.count || 0,
      todayAttendance: attendanceRes.count || 0,
      openComplaints: complaintsRes.count || 0,
      billsSet: billsRes.count || 0,
    });
    setLastUpdated(new Date());
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

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome, {profile?.name}</p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <RefreshCw className="w-3 h-3" />
            Live · {lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Active Students", value: stats.students, color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: CalendarCheck, label: "Today's Attendance", value: stats.todayAttendance, color: "text-green-500", bg: "bg-green-500/10" },
          { icon: MessageSquare, label: "Open Complaints", value: stats.openComplaints, color: "text-purple-500", bg: "bg-purple-500/10" },
          { icon: Zap, label: "Bills Set (This Month)", value: stats.billsSet, color: "text-yellow-500", bg: "bg-yellow-500/10" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
