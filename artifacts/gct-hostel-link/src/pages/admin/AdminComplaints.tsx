import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle, XCircle, Eye, Download, AlertCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Complaint {
  id: string;
  student_id: string;
  category: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "fixed" | "cancelled";
  created_at: string;
  reply?: string;
  profiles?: { name: string; roll_number: string };
}

export default function AdminComplaints() {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [reply, setReply] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  function handleExport() {
    const rows = filtered.map((c) => ({
      Subject: c.subject,
      Category: c.category,
      Status: c.status,
      "Student Name": c.profiles?.name || "",
      "Roll Number": c.profiles?.roll_number || "",
      Description: c.description,
      Reply: c.reply || "",
      "Created At": formatDateTime(c.created_at),
    }));
    exportToCSV(rows, "complaints");
  }

  async function loadComplaints() {
    setFetchError(null);
    const { data: rows, error } = await supabase
      .from("complaints")
      .select("id, student_id, category, subject, description, status, reply, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setFetchError("Failed to load complaints: " + error.message);
      setLoading(false);
      return;
    }
    const list = rows || [];
    const studentIds = [...new Set(list.map((c) => c.student_id).filter(Boolean))];
    let profileMap: Record<string, { name: string; roll_number: string }> = {};
    if (studentIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, roll_number")
        .in("id", studentIds);
      for (const p of profiles || []) {
        profileMap[p.id] = { name: p.name, roll_number: p.roll_number };
      }
    }
    setComplaints(list.map((c) => ({ ...c, profiles: profileMap[c.student_id] })));
    setLoading(false);
  }

  useEffect(() => { loadComplaints(); }, []);

  async function updateStatus(id: string, newStatus: string) {
    const { error: updateErr } = await supabase.from("complaints").update({ status: newStatus }).eq("id", id);
    if (updateErr) {
      toast({ title: "Update Failed", description: "Could not update complaint status. Please try again.", variant: "destructive" });
      return;
    }
    if (newStatus === "fixed" || newStatus === "cancelled") {
      const comp = complaints.find((c) => c.id === id);
      if (comp) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("deleted_complaints").insert({
          id: comp.id, student_id: comp.student_id, category: comp.category,
          subject: comp.subject, description: comp.description, status: newStatus,
          reply: comp.reply, created_at: comp.created_at,
          deleted_at: new Date().toISOString(), deleted_by: user?.id || null,
        });
      }
    }
    toast({ title: "Complaint Updated", description: `Status set to ${newStatus}` });
    loadComplaints();
    setSelected(null);
  }

  async function saveReply(id: string) {
    const { error } = await supabase.from("complaints").update({ reply }).eq("id", id);
    if (error) {
      toast({ title: "Save Failed", description: "Could not save reply. Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: "Reply Saved" });
    setReply("");
    loadComplaints();
    setSelected(null);
  }

  const filtered = complaints.filter((c) => filterStatus === "all" || c.status === filterStatus);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: "bg-blue-500/15 text-blue-600 border-blue-500/30",
      in_progress: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
      fixed: "bg-green-500/15 text-green-600 border-green-500/30",
      cancelled: "bg-red-500/15 text-red-600 border-red-500/30",
    };
    return <Badge className={`text-xs ${map[status] || ""}`}>{status.replace("_", " ")}</Badge>;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Complaints Management</h1>
          <p className="text-sm text-muted-foreground">{complaints.length} total complaints</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "open", "in_progress", "fixed", "cancelled"].map((s) => (
            <Button key={s} size="sm" variant={filterStatus === s ? "default" : "outline"}
              onClick={() => setFilterStatus(s)} className="text-xs capitalize">
              {s.replace("_", " ")}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1" />CSV
          </Button>
        </div>
      </div>

      {fetchError && (
        <div className="mb-4 bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{fetchError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">No complaints found</div>}
          {filtered.map((c) => (
            <Card key={c.id} className="border border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-foreground">{c.subject}</span>
                      {statusBadge(c.status)}
                      <Badge className="text-xs bg-muted text-muted-foreground border-border">{c.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>By: {c.profiles?.name} ({c.profiles?.roll_number})</span>
                      <span>{formatDateTime(c.created_at)}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => { setSelected(c); setReply(c.reply || ""); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Complaint Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="font-semibold text-foreground">{selected.subject}</span>
                  {statusBadge(selected.status)}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  Category: {selected.category} • By: {selected.profiles?.name} • {formatDateTime(selected.created_at)}
                </div>
                <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{selected.description}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Reply / Response</label>
                <Textarea className="mt-1.5" placeholder="Write your reply..." value={reply} onChange={(e) => setReply(e.target.value)} rows={3} />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => saveReply(selected.id)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">Save Reply</Button>
                {selected.status === "open" && <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "in_progress")}>Mark In Progress</Button>}
                {selected.status !== "fixed" && <Button size="sm" variant="outline" className="text-green-600 border-green-500/30 hover:bg-green-500/10" onClick={() => updateStatus(selected.id, "fixed")}><CheckCircle className="w-4 h-4 mr-1" />Mark Fixed</Button>}
                {selected.status !== "cancelled" && <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => updateStatus(selected.id, "cancelled")}><XCircle className="w-4 h-4 mr-1" />Cancel</Button>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
