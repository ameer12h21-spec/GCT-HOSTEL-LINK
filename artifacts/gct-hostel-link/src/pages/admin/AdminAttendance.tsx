import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { Loader2, Save, Download, ShieldCheck } from "lucide-react";
import { exportToCSV } from "@/lib/exportUtils";
import { NetworkWarningBanner } from "@/components/NetworkIndicator";

interface AttendanceEntry {
  studentId: string;
  status: "present" | "absent" | "leave";
  existingId?: string;
}

export default function AdminAttendance() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Profile[]>([]);
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>({});
  const [existing, setExisting] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");

  async function load() {
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
      initialEntries[s.id] = {
        studentId: s.id,
        status: existingMap[s.id]?.status || "present",
        existingId: existingMap[s.id]?.id,
      };
    });
    setExisting(existingMap);
    setEntries(initialEntries);
    setLoading(false);
  }

  useEffect(() => { load(); }, [date]);

  async function saveAttendance() {
    if (Object.keys(entries).length === 0) {
      toast({ title: "No students found.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    let savedCount = 0;
    let failCount = 0;

    for (const entry of Object.values(entries)) {
      const rec = existing[entry.studentId];
      let err;
      if (rec) {
        // Admin can update any record regardless of lock status
        const res = await supabase.from("attendance")
          .update({ status: entry.status, marked_by: user?.id, is_locked: false })
          .eq("id", rec.id);
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
      toast({ title: "Partial Save", description: `${savedCount} saved, ${failCount} failed.`, variant: "destructive" });
    } else {
      toast({ title: "Attendance Saved", description: `${savedCount} records saved for ${date}` });
      if (savedCount > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("audit_logs").insert({
          table_name: "attendance", record_id: date,
          field_name: "bulk_update", old_value: "", new_value: `${savedCount} records updated by admin`,
          changed_by: user?.id,
        });
      }
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
      "Previously Locked": existing[s.id]?.is_locked ? "Yes" : "No",
    }));
    exportToCSV(rows, `admin_attendance_${date}`);
  }

  const filteredStudents = students.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.roll_number || "").toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = Object.values(entries).filter(e => e.status === "present").length;
  const absentCount = Object.values(entries).filter(e => e.status === "absent").length;
  const leaveCount = Object.values(entries).filter(e => e.status === "leave").length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance (Admin)</h1>
          <p className="text-sm text-muted-foreground">No lock restrictions — edit any date, any student</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />CSV
          </Button>
          <Button onClick={saveAttendance} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" />Save All</>}
          </Button>
        </div>
      </div>

      <NetworkWarningBanner />

      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4 text-sm text-green-700 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        Admin override: all records editable regardless of lock status. Changes are audit-logged.
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="flex gap-4 mb-4 text-sm flex-wrap">
          <span className="text-green-600">Present: <strong>{presentCount}</strong></span>
          <span className="text-red-600">Absent: <strong>{absentCount}</strong></span>
          <span className="text-yellow-600">Leave: <strong>{leaveCount}</strong></span>
          <span className="text-muted-foreground">Total: <strong>{students.length}</strong></span>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or roll number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No active students found</div>
      ) : (
        <div className="space-y-2">
          {filteredStudents.map((s) => {
            const entry = entries[s.id];
            const wasLocked = existing[s.id]?.is_locked;
            const currentStatus = entry?.status || "present";
            return (
              <Card key={s.id} className="border border-border">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                        {s.profile_photo_url ? <img src={s.profile_photo_url} alt="" className="w-full h-full object-cover" /> : s.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.roll_number} • {s.hostel}
                          {wasLocked && <span className="ml-1 text-orange-500">(was locked)</span>}
                        </div>
                      </div>
                    </div>
                    <Select
                      value={currentStatus}
                      onValueChange={(v) => setEntries({ ...entries, [s.id]: { ...entries[s.id], status: v as any } })}>
                      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="leave">Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating save on scroll */}
      {filteredStudents.length > 5 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button onClick={saveAttendance} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Save All</>}
          </Button>
        </div>
      )}
    </div>
  );
}
