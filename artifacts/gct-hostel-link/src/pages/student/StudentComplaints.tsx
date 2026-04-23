import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, MessageSquare, RefreshCw } from "lucide-react";
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

const CATEGORIES = ["Maintenance", "Food Quality", "Electricity", "Water Supply", "Cleanliness", "Security", "Room Issue", "Internet", "Other"];

export default function StudentComplaints() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ category: "", subject: "", description: "" });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadComplaints = useCallback(async () => {
    // Fetch all complaints — RLS ensures students see all (anonymous view) while names are hidden in UI
    const { data } = await supabase
      .from("complaints")
      .select("id, student_id, category, subject, description, status, reply, created_at")
      .order("created_at", { ascending: false });
    setComplaints(data || []);
    setLoading(false);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    loadComplaints();
    const ch = supabase.channel("student_complaints_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => loadComplaints())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadComplaints]);

  async function submitComplaint() {
    if (!form.category || !form.subject.trim() || !form.description.trim()) {
      toast({ title: "All fields required", description: "Please fill in category, subject, and description.", variant: "destructive" });
      return;
    }
    if (form.subject.trim().length < 5) {
      toast({ title: "Subject too short", description: "Please provide a more descriptive subject.", variant: "destructive" });
      return;
    }
    if (form.description.trim().length < 20) {
      toast({ title: "Description too short", description: "Please describe your complaint in at least 20 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("complaints").insert({
      student_id: profile!.id,
      category: form.category,
      subject: form.subject.trim(),
      description: form.description.trim(),
      status: "open",
    });
    if (!error) {
      toast({ title: "Complaint Submitted", description: "Your complaint has been submitted. You can track its status below." });
      setForm({ category: "", subject: "", description: "" });
      setShowForm(false);
    } else {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
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
  const otherComplaints = complaints.filter((c) => c.student_id !== profile?.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Complaints</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Submit & track hostel complaints
            {lastUpdated && (
              <span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground/60">
                <RefreshCw className="w-3 h-3" />Live
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <Plus className="w-4 h-4 mr-2" />New Complaint
        </Button>
      </div>

      {showForm && (
        <Card className="border border-primary/30 mb-6">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4" />Submit a Complaint</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-600">
              Your identity is anonymous to other students. Teachers and admin can see your name.
            </div>
            <div>
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category…" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject <span className="text-red-500">*</span></Label>
              <Input className="mt-1.5" placeholder="Brief title of your complaint" value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={100} />
            </div>
            <div>
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea className="mt-1.5" placeholder="Describe your complaint in detail (at least 20 characters)…"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} maxLength={1000} />
              <p className="text-xs text-muted-foreground mt-1">{form.description.length}/1000</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={submitComplaint} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white" disabled={submitting}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Complaint"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setForm({ category: "", subject: "", description: "" }); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {/* My Complaints */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            My Complaints ({myComplaints.length})
          </h2>
          {myComplaints.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">You haven't submitted any complaints yet.</div>
          ) : (
            <div className="space-y-3">
              {myComplaints.map((c) => (
                <Card key={c.id} className="border border-border border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-foreground">{c.subject}</span>
                          {statusBadge(c.status)}
                          <Badge className="text-xs bg-muted text-muted-foreground border-border">{c.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                        {c.reply && (
                          <div className="mt-2 bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-xs">
                            <span className="font-semibold text-green-700 dark:text-green-400">Admin Reply: </span>
                            <span className="text-foreground">{c.reply}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatDateTime(c.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Other students' complaints — anonymous */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            All Hostel Complaints ({otherComplaints.length})
          </h2>
          <p className="text-xs text-muted-foreground mb-3">Student identities are hidden for privacy</p>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : otherComplaints.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">No other complaints found</div>
          ) : (
            <div className="space-y-3">
              {otherComplaints.map((c) => (
                <Card key={c.id} className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-foreground">{c.subject}</span>
                          {statusBadge(c.status)}
                          <Badge className="text-xs bg-muted text-muted-foreground border-border">{c.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">By: Anonymous Student</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatDateTime(c.created_at)}</span>
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
