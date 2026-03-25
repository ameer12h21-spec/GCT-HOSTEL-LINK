import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Loader2, CalendarCheck, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/exportUtils";

interface Attendance {
  id: string;
  date: string;
  status: "present" | "absent" | "leave";
}

export default function StudentAttendance() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (!profile) return;
    const [year, mon] = filterMonth.split("-").map(Number);
    const nextMonthStart = mon === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(mon + 1).padStart(2, "0")}-01`;
    supabase.from("attendance").select("id, date, status")
      .eq("student_id", profile.id)
      .gte("date", `${filterMonth}-01`)
      .lt("date", nextMonthStart)
      .order("date", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("Attendance fetch error:", error.message);
        setRecords(data || []);
        setLoading(false);
      });
  }, [profile, filterMonth]);

  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const leave = records.filter((r) => r.status === "leave").length;

  function handleExport() {
    const rows = records.map((r) => ({
      Date: formatDate(r.date),
      Status: r.status,
    }));
    exportToCSV(rows, `my_attendance_${filterMonth}`);
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      present: "bg-green-500/15 text-green-600 border-green-500/30",
      absent: "bg-red-500/15 text-red-600 border-red-500/30",
      leave: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    };
    return <Badge className={`text-xs capitalize ${map[status]}`}>{status}</Badge>;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Attendance</h1>
          <p className="text-sm text-muted-foreground">View-only — Marked by teachers</p>
        </div>
        <div className="flex gap-2">
          <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{present}</div>
            <div className="text-xs text-muted-foreground">Present</div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{absent}</div>
            <div className="text-xs text-muted-foreground">Absent</div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{leave}</div>
            <div className="text-xs text-muted-foreground">Leave</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No attendance records for this month</div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <Card key={r.id} className="border border-border">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CalendarCheck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{formatDate(r.date)}</span>
                </div>
                {statusBadge(r.status)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
