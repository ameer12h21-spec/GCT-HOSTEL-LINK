import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { Loader2, Save, Lock, Download, AlertCircle } from "lucide-react";
import { exportToCSV } from "@/lib/exportUtils";
import { NetworkWarningBanner } from "@/components/NetworkIndicator";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface AttendanceEntry {
  studentId: string;
  status: "present" | "absent" | "leave";
}

export default function TeacherAttendance() {
  const { toast } = useToast();
  const net = useNetworkStatus();
  const [students, setStudents] = useState<Profile[]>([]);
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>({});
  const [existing, setExisting] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: studentsData } = await supabase
      .from("profiles").select("*").eq("role", "student").eq("status", "active").order("name");
    const studs = studentsData || [];
    setStudents(studs);
    const { data: attData } = await supabase.from("attendance").select("*").eq("date", date);
    const existingMap: Record<string, any> = {};
    const initialEntries: Record<string, AttendanceEntry> = {};
    (attData || []).forEach((a) => { existingMap[a.student_id] = a; });
    studs.forEach((s) => {
      initialEntries[s.id] = { studentId: s.id, status: existingMap[s.id]?.status || "present" };
    });
    setExisting(existingMap);
    setEntries(initialEntries);
    setLoading(false);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  function isLocked(studentId: string): boolean {
    const rec = existing[studentId];
    if (!rec) return false;
    const lockDate = new Date(date);
    lockDate.setDate(lockDate.getDate() + 3);
    return rec.is_locked || new Date() > lockDate;
  }

  async function saveAttendance() {
    if (!net.isOnline) {
      toast({ title: "No Internet", description: "You are offline. Please reconnect before saving attendance.", variant: "destructive" });
      return;
    }
    const unlockedEntries = Object.values(entries).filter((e) => !isLocked(e.studentId));
    if (unlockedEntries.length === 0) {
      toast({ title: "All records are locked", description: "Admin must unlock for edits." });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    let savedCount = 0;
    let failCount = 0;

    for (const entry of unlockedEntries) {
      if (isLocked(entry.studentId)) continue;
      let err;
      if (existing[entry.studentId]) {
        const res = await supabase.from("attendance")
          .update({ status: entry.status, marked_by: user?.id })
          .eq("id", existing[entry.studentId].id);
        err = res.error;
      } else {
        const res = await supabase.from("attendance").insert({
          student_id: entry.studentId, date, status: entry.status,
          marked_by: user?.id, is_locked: false,
        });
        err = res.error;
      }
      if (err) failCount++; else savedCount++;
    }

    if (failCount > 0) {
      toast({ title: "Partial Save", description: `${savedCount} saved, ${failCount} failed. Check connection and retry.`, variant: "destructive" });
    } else {
      toast({ title: "Attendance Saved", description: `${savedCount} record(s) saved for ${date}` });
    }
    setSaving(false);
    load();
  }

  function handleExport() {
    const rows = students.map((s) => ({
      Name: s.name,
      "Roll Number": s.roll_number || "",
      Hostel: s.hostel || "",
      Date: date,
      Status: entries[s.id]?.status || "present",
      Locked: isLocked(s.id) ? "Yes" : "No",
    }));
    exportToCSV(rows, `attendance_${date}`);
  }

  const lockedCount = Object.keys(entries).filter((id) => isLocked(id)).length;
  const presentCount = Object.values(entries).filter((e) => e.status === "present").length;
  const absentCount = Object.values(entries).filter((e) => e.status === "absent").length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">Mark once daily — records lock after 3 days</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />CSV
          </Button>
          <Button onClick={saveAttendance}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            disabled={saving || !net.isOnline}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <NetworkWarningBanner />

      {!loading && students.length > 0 && (
        <div className="flex gap-4 text-sm mb-4">
          <span className="text-green-600 font-medium">Present: <strong>{presentCount}</strong></span>
          <span className="text-red-600 font-medium">Absent: <strong>{absentCount}</strong></span>
          <span className="text-yellow-600 font-medium">Leave: <strong>{students.length - presentCount - absentCount}</strong></span>
        </div>
      )}

      {lockedCount > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-4 text-sm text-orange-600 flex items-center gap-2">
          <Lock className="w-4 h-4 flex-shrink-0" />
          {lockedCount} record(s) are locked and cannot be edited. Contact admin to unlock.
        </div>
      )}

      {!net.isOnline && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          You are offline. Attendance cannot be saved until reconnected.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No active students found</div>
      ) : (
        <div className="space-y-2">
          {students.map((s) => {
            const locked = isLocked(s.id);
            const currentStatus = entries[s.id]?.status || "present";
            const statusColor = currentStatus === "present" ? "bg-green-500/15 text-green-600 border-green-500/30"
              : currentStatus === "absent" ? "bg-red-500/15 text-red-600 border-red-500/30"
              : "bg-yellow-500/15 text-yellow-600 border-yellow-500/30";
            return (
              <Card key={s.id} className={`border transition-opacity ${locked ? "border-orange-500/20 opacity-60" : "border-border"}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${currentStatus === "present" ? "bg-gradient-to-br from-green-500 to-emerald-600" : currentStatus === "absent" ? "bg-gradient-to-br from-red-500 to-rose-600" : "bg-gradient-to-br from-yellow-500 to-orange-600"}`}>
                        {s.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.roll_number} · {s.hostel}</div>
                      </div>
                    </div>
                    {locked ? (
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${statusColor}`}>{currentStatus}</Badge>
                        <Lock className="w-4 h-4 text-orange-400" />
                      </div>
                    ) : (
                      <Select value={currentStatus}
                        onValueChange={(v) => setEntries({ ...entries, [s.id]: { ...entries[s.id], status: v as any } })}>
                        <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">✅ Present</SelectItem>
                          <SelectItem value="absent">❌ Absent</SelectItem>
                          <SelectItem value="leave">🟡 Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
