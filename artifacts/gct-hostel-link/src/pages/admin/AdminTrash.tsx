import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, RotateCcw, Trash2, History } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

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
  deleted_at: string;
}

interface DeletedComplaint {
  id: string;
  subject: string;
  category: string;
  status: string;
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
      const { data } = await supabase.from("audit_logs").select("*, profiles(name)").order("created_at", { ascending: false }).limit(100);
      setAuditLogs(data || []);
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
    toast({ title: "Restore not available via UI", description: "Manual database restore needed for deleted auth users." });
  }

  async function purgeProfile(id: string) {
    if (!confirm("Permanently delete this record? This cannot be undone.")) return;
    await supabase.from("deleted_profiles").delete().eq("id", id);
    toast({ title: "Record Permanently Deleted" });
    loadData();
  }

  async function restoreComplaint(c: DeletedComplaint) {
    await supabase.from("complaints").insert({ ...c, status: "open", deleted_at: undefined, deleted_by: undefined });
    await supabase.from("deleted_complaints").delete().eq("id", c.id);
    toast({ title: "Complaint Restored" });
    loadData();
  }

  async function purgeComplaint(id: string) {
    if (!confirm("Permanently delete? Cannot be undone.")) return;
    await supabase.from("deleted_complaints").delete().eq("id", id);
    toast({ title: "Permanently Deleted" });
    loadData();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Trash & Audit Logs</h1>
        <p className="text-sm text-muted-foreground">View deleted records and system audit history</p>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: "audit", label: "Audit Logs" },
          { key: "deleted_users", label: "Deleted Users" },
          { key: "deleted_complaints", label: "Deleted Complaints" },
        ].map((t) => (
          <Button key={t.key} size="sm" variant={tab === t.key ? "default" : "outline"} onClick={() => setTab(t.key as any)}>
            {t.label}
          </Button>
        ))}
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
                          <span className="font-medium text-foreground">{log.profiles?.name || "Unknown"}</span>
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
              {deletedProfiles.map((p) => (
                <Card key={p.id} className="border border-border border-red-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium text-sm text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.email} • {p.role} {p.roll_number && `• ${p.roll_number}`}</div>
                        <div className="text-xs text-muted-foreground mt-1">Deleted: {formatDateTime(p.deleted_at)}</div>
                      </div>
                      <div className="flex gap-2">
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
                        <div className="text-xs text-muted-foreground">{c.category} • Status: {c.status}</div>
                        <div className="text-xs text-muted-foreground mt-1">Deleted: {formatDateTime(c.deleted_at)}</div>
                      </div>
                      <div className="flex gap-2">
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
