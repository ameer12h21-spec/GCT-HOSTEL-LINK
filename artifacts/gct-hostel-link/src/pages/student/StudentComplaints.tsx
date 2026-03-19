import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, MessageSquare } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Complaint {
  id: string;
  student_id: string;
  category: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "fixed" | "cancelled";
  reply?: string;
  created_at: string;
}

export default function StudentComplaints() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ category: "", subject: "", description: "" });

  async function loadComplaints() {
    const { data } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });
    setComplaints(data || []);
    setLoading(false);
  }

  useEffect(() => { loadComplaints(); }, []);

  async function submitComplaint() {
    if (!form.category || !form.subject || !form.description) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("complaints").insert({
      student_id: profile!.id,
      category: form.category,
      subject: form.subject,
      description: form.description,
      status: "open",
    });
    if (!error) {
      toast({ title: "Complaint Submitted", description: "Your complaint has been submitted anonymously." });
      setForm({ category: "", subject: "", description: "" });
      setShowForm(false);
      loadComplaints();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSubmitting(false);
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: "bg-blue-500/15 text-blue-600 border-blue-500/30",
      in_progress: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
      fixed: "bg-green-500/15 text-green-600 border-green-500/30",
      cancelled: "bg-red-500/15 text-red-600 border-red-500/30",
    };
    return <Badge className={`text-xs ${map[status] || ""}`}>{status.replace("_", " ")}</Badge>;
  };

  const myComplaints = complaints.filter((c) => c.student_id === profile?.id);
  const allComplaints = complaints.filter((c) => c.student_id !== profile?.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Complaints</h1>
          <p className="text-sm text-muted-foreground">Submit & view hostel complaints</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <Plus className="w-4 h-4 mr-2" />New Complaint
        </Button>
      </div>

      {showForm && (
        <Card className="border border-primary/30 mb-6">
          <CardHeader><CardTitle className="text-base">Submit a Complaint</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-600">
              Your identity is anonymous to other students. Teachers and admin can see your name.
            </div>
            <div>
              <Label>Category *</Label>
              <Input className="mt-1.5" placeholder="e.g. Maintenance, Food, Electricity, Cleanliness..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <Label>Subject *</Label>
              <Input className="mt-1.5" placeholder="Brief title of your complaint" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea className="mt-1.5" placeholder="Describe your complaint in detail..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div className="flex gap-3">
              <Button onClick={submitComplaint} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white" disabled={submitting}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Complaint"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">My Complaints ({myComplaints.length})</h2>
          {myComplaints.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">You haven't submitted any complaints yet.</div>
          ) : (
            <div className="space-y-3">
              {myComplaints.map((c) => (
                <Card key={c.id} className="border border-border border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-foreground">{c.subject}</span>
                          {statusBadge(c.status)}
                          <Badge className="text-xs bg-muted text-muted-foreground border-border">{c.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                        {c.reply && (
                          <div className="mt-2 bg-muted/50 rounded-lg p-2 text-xs">
                            <span className="font-medium text-foreground">Reply: </span>
                            <span className="text-muted-foreground">{c.reply}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">All Complaints ({allComplaints.length})</h2>
          <p className="text-xs text-muted-foreground mb-3">Identities are anonymous to other students</p>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : allComplaints.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">No other complaints found</div>
          ) : (
            <div className="space-y-3">
              {allComplaints.map((c) => (
                <Card key={c.id} className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-foreground">{c.subject}</span>
                          {statusBadge(c.status)}
                          <Badge className="text-xs bg-muted text-muted-foreground border-border">{c.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">By: Anonymous Student</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
