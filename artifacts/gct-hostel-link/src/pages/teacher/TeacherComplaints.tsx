import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle, XCircle, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils";

interface Complaint {
  id: string;
  student_id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  reply?: string;
  created_at: string;
  profiles?: { name: string; roll_number: string };
}

export default function TeacherComplaints() {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [reply, setReply] = useState("");

  async function load() {
    const { data: rows, error } = await supabase.from("complaints")
      .select("id, student_id, category, subject, description, status, reply, created_at")
      .not("status", "in", '("fixed","cancelled")')
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Complaints fetch error:", error.message);
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

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    const comp = complaints.find((c) => c.id === id);
    await supabase.from("complaints").update({ status }).eq("id", id);
    if (status === "fixed" || status === "cancelled") {
      if (comp) await supabase.from("deleted_complaints").insert({ ...comp, deleted_at: new Date().toISOString(), deleted_by: "teacher" });
    }
    toast({ title: "Status Updated" });
    load();
    setSelected(null);
  }

  async function saveReply(id: string) {
    await supabase.from("complaints").update({ reply }).eq("id", id);
    toast({ title: "Reply Saved" });
    load();
    setSelected(null);
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: "bg-blue-500/15 text-blue-600 border-blue-500/30",
      in_progress: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    };
    return <Badge className={`text-xs ${map[status] || "bg-muted text-muted-foreground"}`}>{status.replace("_", " ")}</Badge>;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Complaints</h1>
        <p className="text-sm text-muted-foreground">Open & in-progress complaints (fixed/cancelled moved to Admin Trash)</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {complaints.length === 0 && <div className="text-center py-12 text-muted-foreground">No open complaints</div>}
          {complaints.map((c) => (
            <Card key={c.id} className="border border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-foreground">{c.subject}</span>
                      {statusBadge(c.status)}
                      <Badge className="text-xs bg-muted text-muted-foreground border-border">{c.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">By: {c.profiles?.name} ({c.profiles?.roll_number})</p>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Complaint Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground">{selected.subject}</p>
                <p className="text-xs text-muted-foreground mb-2">{selected.category} • {selected.profiles?.name} • {formatDateTime(selected.created_at)}</p>
                <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{selected.description}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Reply</label>
                <Textarea className="mt-1.5" placeholder="Write reply..." value={reply} onChange={(e) => setReply(e.target.value)} rows={3} />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => saveReply(selected.id)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">Save Reply</Button>
                {selected.status === "open" && <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "in_progress")}>In Progress</Button>}
                <Button size="sm" variant="outline" className="text-green-600 border-green-500/30" onClick={() => updateStatus(selected.id, "fixed")}><CheckCircle className="w-4 h-4 mr-1" />Fixed</Button>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => updateStatus(selected.id, "cancelled")}><XCircle className="w-4 h-4 mr-1" />Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
