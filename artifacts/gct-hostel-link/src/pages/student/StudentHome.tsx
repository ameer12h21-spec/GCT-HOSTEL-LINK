import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { CalendarCheck, DollarSign, Zap, MessageSquare, RefreshCw } from "lucide-react";
import { formatPKR } from "@/lib/utils";

export default function StudentHome() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState({
    presentCount: 0, absentCount: 0,
    messFee: null as any, electricityBill: null as any, openComplaints: 0,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const month = new Date().toISOString().slice(0, 7);
    const [attendanceRes, messRes, elecRes, complaintsRes] = await Promise.all([
      supabase.from("attendance").select("status").eq("student_id", profile.id).gte("date", `${month}-01`),
      supabase.from("mess_fees").select("*").eq("student_id", profile.id).eq("month", month).maybeSingle(),
      supabase.from("electricity_bills").select("*").eq("student_id", profile.id).eq("month", month).maybeSingle(),
      supabase.from("complaints").select("id", { count: "exact" }).eq("student_id", profile.id).eq("status", "open"),
    ]);
    setSummary({
      presentCount: (attendanceRes.data || []).filter((a) => a.status === "present").length,
      absentCount: (attendanceRes.data || []).filter((a) => a.status === "absent").length,
      messFee: messRes.data,
      electricityBill: elecRes.data,
      openComplaints: complaintsRes.count || 0,
    });
    setLastUpdated(new Date());
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    load();
    const ch = supabase.channel("student_home_rt_" + profile.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "mess_fees",
        filter: `student_id=eq.${profile.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "electricity_bills",
        filter: `student_id=eq.${profile.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance",
        filter: `student_id=eq.${profile.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints",
        filter: `student_id=eq.${profile.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile, load]);

  if (!profile) return null;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {profile.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">{profile.hostel} Hostel • Room {profile.room_no} • Shift {profile.shift}</p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <RefreshCw className="w-3 h-3" />
            Live · {lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">{summary.presentCount}</p>
                <p className="text-xs text-muted-foreground">Days Present</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mess Fee</p>
                <p className="text-lg font-bold text-foreground">
                  {summary.messFee ? formatPKR(Number(summary.messFee.amount)) : "Not Set"}
                </p>
                <Badge className={`text-xs ${summary.messFee?.status === "paid" ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-red-500/15 text-red-600 border-red-500/30"}`}>
                  {summary.messFee?.status || "Unpaid"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Electricity</p>
                <p className="text-lg font-bold text-foreground">
                  {summary.electricityBill ? formatPKR(Number(summary.electricityBill.amount)) : "Not Set"}
                </p>
                <Badge className={`text-xs ${summary.electricityBill?.status === "paid" ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-red-500/15 text-red-600 border-red-500/30"}`}>
                  {summary.electricityBill?.status || "Pending"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Complaints</p>
                <p className="text-2xl font-bold text-foreground">{summary.openComplaints}</p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-border">
          <CardHeader><CardTitle className="text-base">My Details</CardTitle></CardHeader>
          <CardContent>
            {[
              ["Roll Number", profile.roll_number],
              ["Technology", profile.technology],
              ["Room No", profile.room_no],
              ["Hostel", `${profile.hostel} Hostel`],
              ["Shift", `${profile.shift} Shift`],
              ["Email", profile.email],
              ["Phone", profile.phone],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium text-foreground">{v || "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader><CardTitle className="text-base">This Month Attendance</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-500/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{summary.presentCount}</div>
                <div className="text-sm text-muted-foreground">Present</div>
              </div>
              <div className="bg-red-500/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{summary.absentCount}</div>
                <div className="text-sm text-muted-foreground">Absent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
