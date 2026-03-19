import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { Loader2, Save, Lock } from "lucide-react";

interface AttendanceEntry {
  studentId: string;
  status: "present" | "absent" | "leave";
}

export default function TeacherAttendance() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Profile[]>([]);
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>({});
  const [existing, setExisting] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  async function load() {
    setLoading(true);
    const { data: studentsData } = await supabase.from("profiles").select("*").eq("role", "student").eq("status", "active").order("name");
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
  }

  useEffect(() => { load(); }, [date]);

  function isLocked(studentId: string): boolean {
    const rec = existing[studentId];
    if (!rec) return false;
    const recordDate = new Date(date);
    const lockDate = new Date(date);
    lockDate.setDate(lockDate.getDate() + 3);
    return rec.is_locked || new Date() > lockDate;
  }

  async function saveAttendance() {
    const unlockedEntries = Object.values(entries).filter((e) => !isLocked(e.studentId));
    if (unlockedEntries.length === 0) {
      toast({ title: "All records are locked", description: "Admin must unlock for edits." });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    for (const entry of unlockedEntries) {
      const locked = isLocked(entry.studentId);
      if (locked) continue;
      if (existing[entry.studentId]) {
        await supabase.from("attendance").update({ status: entry.status, marked_by: user?.id }).eq("id", existing[entry.studentId].id);
      } else {
        await supabase.from("attendance").insert({ student_id: entry.studentId, date, status: entry.status, marked_by: user?.id, is_locked: false });
      }
    }

    toast({ title: "Attendance Saved", description: `${unlockedEntries.length} records saved for ${date}` });
    setSaving(false);
    load();
  }

  const lockedCount = Object.keys(entries).filter((id) => isLocked(id)).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">Mark once daily — locks after 3 days</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split("T")[0]}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
          <Button onClick={saveAttendance} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "" : "Save"}
          </Button>
        </div>
      </div>

      {lockedCount > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-4 text-sm text-orange-600 flex items-center gap-2">
          <Lock className="w-4 h-4" />{lockedCount} record(s) are locked. Contact admin to edit.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {students.map((s) => {
            const locked = isLocked(s.id);
            const currentStatus = entries[s.id]?.status || "present";
            return (
              <Card key={s.id} className={`border ${locked ? "border-orange-500/20 opacity-70" : "border-border"}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.roll_number} • {s.hostel}</div>
                      </div>
                    </div>
                    {locked ? (
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${currentStatus === "present" ? "bg-green-500/15 text-green-600" : currentStatus === "absent" ? "bg-red-500/15 text-red-600" : "bg-yellow-500/15 text-yellow-600"}`}>
                          {currentStatus}
                        </Badge>
                        <Lock className="w-4 h-4 text-orange-500" />
                      </div>
                    ) : (
                      <Select value={currentStatus} onValueChange={(v) => setEntries({ ...entries, [s.id]: { ...entries[s.id], status: v as any } })}>
                        <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="leave">Leave</SelectItem>
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
