import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Lock, Unlock, Edit2, Check, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportUtils";

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: "present" | "absent" | "leave";
  is_locked: boolean;
  marked_by: string;
  profiles?: { name: string; roll_number: string; hostel: string };
}

export default function AdminAttendance() {
  const { toast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

  async function loadRecords() {
    const { data } = await supabase
      .from("attendance")
      .select("*, profiles(name, roll_number, hostel)")
      .eq("date", filterDate)
      .order("date", { ascending: false });
    setRecords(data || []);
    setLoading(false);
  }

  useEffect(() => { loadRecords(); }, [filterDate]);

  async function unlockAndEdit(record: AttendanceRecord) {
    setEditingId(record.id);
    setEditStatus(record.status);
    if (record.is_locked) {
      await supabase.from("attendance").update({ is_locked: false }).eq("id", record.id);
    }
  }

  async function saveEdit(record: AttendanceRecord) {
    const { error } = await supabase.from("attendance")
      .update({ status: editStatus, is_locked: true }).eq("id", record.id);
    if (!error) {
      toast({ title: "Attendance Updated" });
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("audit_logs").insert({
        table_name: "attendance", record_id: record.id, field_name: "status",
        old_value: record.status, new_value: editStatus, changed_by: user?.id
      });
    }
    setEditingId(null);
    loadRecords();
  }

  function handleExport() {
    const rows = records.map((r) => ({
      Name: r.profiles?.name || "",
      "Roll Number": r.profiles?.roll_number || "",
      Hostel: r.profiles?.hostel || "",
      Date: r.date,
      Status: r.status,
      Locked: r.is_locked ? "Yes" : "No",
    }));
    exportToCSV(rows, `attendance_${filterDate}`);
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      present: "bg-green-500/15 text-green-600 border-green-500/30",
      absent: "bg-red-500/15 text-red-600 border-red-500/30",
      leave: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    };
    return <Badge className={`text-xs ${map[status] || ""}`}>{status}</Badge>;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance Control</h1>
          <p className="text-sm text-muted-foreground">Admin can override locked attendance records</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />CSV
          </Button>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-6 text-sm text-blue-600">
        Attendance locks automatically after 3 days. As admin, you can unlock and edit any record.
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No attendance records for {formatDate(filterDate)}</div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <Card key={r.id} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {r.profiles?.name?.charAt(0) || "S"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-foreground">{r.profiles?.name}</div>
                      <div className="text-xs text-muted-foreground">{r.profiles?.roll_number} • {r.profiles?.hostel} Hostel</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === r.id ? (
                      <>
                        <Select value={editStatus} onValueChange={setEditStatus}>
                          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="leave">Leave</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => saveEdit(r)}>
                          <Check className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {statusBadge(r.status)}
                        {r.is_locked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => unlockAndEdit(r)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
