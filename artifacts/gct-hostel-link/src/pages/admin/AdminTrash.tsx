import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, RotateCcw, Trash2, History, Download } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportUtils";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  field_name: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  created_at: string;
  profiles?: { name: string };
}

interface DeletedProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  roll_number?: string;
  phone?: string;
  technology?: string;
  hostel?: string;
  room_no?: string;
  shift?: string;
  deleted_at: string;
}

interface DeletedComplaint {
  id: string;
  subject: string;
  category: string;
  status: string;
  description?: string;
  student_id?: string;
  created_at: string;
  deleted_at: string;
}

export default function AdminTrash() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"audit" | "deleted_users" | "deleted_complaints">("audit");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [deletedProfiles, setDeletedProfiles] = useState<DeletedProfile[]>([]);
  const [deletedComplaints, setDeletedComplaints] = useState<DeletedComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    if (tab === "audit") {
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("id, table_name, record_id, field_name, old_value, new_value, changed_by, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        console.error("Audit logs fetch error:", error.message);
        setLoading(false);
        return;
      }
      const list = logs || [];
      const userIds = [...new Set(list.map((l) => l.changed_by).filter(Boolean))];
      let profileMap: Record<string, { name: string }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", userIds);
        for (const p of profiles || []) profileMap[p.id] = { name: p.name };
      }
      setAuditLogs(list.map((l) => ({ ...l, profiles: profileMap[l.changed_by] })));
    } else if (tab === "deleted_users") {
      const { data } = await supabase.from("deleted_profiles").select("*").order("deleted_at", { ascending: false });
      setDeletedProfiles(data || []);
    } else {
      const { data } = await supabase.from("deleted_complaints").select("*").order("deleted_at", { ascending: false });
      setDeletedComplaints(data || []);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [tab]);

  async function restoreProfile(p: DeletedProfile) {
    if (!confirm(`Restore ${p.name}'s profile? They will be restored as "disabled" status. You must recreate their login in Supabase Auth if needed.`)) return;
    const { error } = await supabase.from("profiles").insert({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role,
      status: "disabled",
      roll_number: p.roll_number,
      phone: p.phone,
      technology: p.technology,
      hostel: p.hostel,
      room_no: p.room_no,
      shift: p.shift,
    });
    if (error) {
      toast({ title: "Restore Failed", description: "Profile may already exist or there's a DB conflict. " + error.message, variant: "destructive" });
      return;
    }
    await supabase.from("deleted_profiles").delete().eq("id", p.id);
    toast({ title: "Profile Restored", description: `${p.name} restored as disabled. Activate from Students page.` });
    loadData();
  }

  async function purgeProfile(id: string) {
    if (!confirm("Permanently delete this record? This cannot be undone.")) return;
    await supabase.from("deleted_profiles").delete().eq("id", id);
    toast({ title: "Record Permanently Deleted" });
    loadData();
  }

  async function restoreComplaint(c: DeletedComplaint) {
    const { error } = await supabase.from("complaints").insert({
      id: c.id,
      subject: c.subject,
      category: c.category,
      status: "open",
      description: c.description || "",
      student_id: c.student_id || null,
      created_at: c.created_at,
    });
    if (error) {
      toast({ title: "Restore Failed", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.from("deleted_complaints").delete().eq("id", c.id);
    toast({ title: "Complaint Restored", description: "Complaint is now open again." });
    loadData();
  }

  async function purgeComplaint(id: string) {
    if (!confirm("Permanently delete? Cannot be undone.")) return;
    await supabase.from("deleted_complaints").delete().eq("id", id);
    toast({ title: "Permanently Deleted" });
    loadData();
  }

  function exportAuditLogs() {
    const rows = auditLogs.map((l) => ({
      "Changed By": l.profiles?.name || l.changed_by || "System",
      Table: l.table_name,
      Field: l.field_name,
      "Old Value": l.old_value,
      "New Value": l.new_value,
      "Date": formatDateTime(l.created_at),
    }));
    exportToCSV(rows, "audit_logs");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Trash & Audit Logs</h1>
        <p className="text-sm text-muted-foreground">View deleted records and system audit history</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "audit", label: "Audit Logs" },
          { key: "deleted_users", label: "Deleted Users" },
          { key: "deleted_complaints", label: "Deleted Complaints" },
        ].map((t) => (
          <Button key={t.key} size="sm" variant={tab === t.key ? "default" : "outline"} onClick={() => setTab(t.key as any)}>
            {t.label}
          </Button>
        ))}
        {tab === "audit" && (
          <Button size="sm" variant="outline" onClick={exportAuditLogs} className="ml-auto">
            <Download className="w-3.5 h-3.5 mr-1" />Export CSV
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {tab === "audit" && (
            <div className="space-y-2">
              {auditLogs.length === 0 && <div className="text-center py-12 text-muted-foreground">No audit logs yet</div>}
              {auditLogs.map((log) => (
                <Card key={log.id} className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <History className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap text-sm">
                          <span className="font-medium text-foreground">{log.profiles?.name || "System"}</span>
                          <span className="text-muted-foreground">changed</span>
                          <Badge className="text-xs bg-muted text-muted-foreground border-border">{log.table_name}.{log.field_name}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="line-through text-red-500/70">{log.old_value || "—"}</span>
                          <span>→</span>
                          <span className="text-green-600">{log.new_value || "—"}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{formatDateTime(log.created_at)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {tab === "deleted_users" && (
            <div className="space-y-3">
              {deletedProfiles.length === 0 && <div className="text-center py-12 text-muted-foreground">No deleted users</div>}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-600 mb-4">
                Restoring a profile re-inserts the data as "disabled". The user must be re-created in Supabase Auth to login again.
              </div>
              {deletedProfiles.map((p) => (
                <Card key={p.id} className="border border-border border-red-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium text-sm text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.email} • {p.role} {p.roll_number && `• ${p.roll_number}`}</div>
                        {p.hostel && <div className="text-xs text-muted-foreground">{p.hostel} Hostel • Room {p.room_no}</div>}
                        <div className="text-xs text-muted-foreground mt-1">Deleted: {formatDateTime(p.deleted_at)}</div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" className="text-xs text-blue-600 border-blue-500/30 hover:bg-blue-500/10" onClick={() => restoreProfile(p)}>
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />Restore
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs" onClick={() => purgeProfile(p.id)}>
                          <Trash2 className="w-3.5 h-3.5 mr-1" />Purge
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {tab === "deleted_complaints" && (
            <div className="space-y-3">
              {deletedComplaints.length === 0 && <div className="text-center py-12 text-muted-foreground">No deleted complaints</div>}
              {deletedComplaints.map((c) => (
                <Card key={c.id} className="border border-border border-orange-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium text-sm text-foreground">{c.subject}</div>
                        <div className="text-xs text-muted-foreground">{c.category} • was: {c.status}</div>
                        {c.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.description}</div>}
                        <div className="text-xs text-muted-foreground mt-1">Deleted: {formatDateTime(c.deleted_at)}</div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => restoreComplaint(c)}>
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />Restore
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs" onClick={() => purgeComplaint(c.id)}>
                          <Trash2 className="w-3.5 h-3.5 mr-1" />Purge
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
