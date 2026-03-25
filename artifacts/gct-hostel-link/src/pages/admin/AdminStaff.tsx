import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/lib/supabase";
import { Plus, Trash2, Loader2, Eye, XCircle, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminStaff() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "teacher" as UserRole, password: "" });

  async function loadStaff() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["teacher", "mess_owner", "admin"])
      .order("created_at", { ascending: false });
    setStaff(data || []);
    setLoading(false);
  }

  useEffect(() => { loadStaff(); }, []);

  function generateSecretKey(role: UserRole, count: number): string {
    const prefix = role === "admin" ? "ADMIN" : role === "teacher" ? "TEACH" : "MESS";
    return `${prefix}-${String(count + 1).padStart(3, "0")}`;
  }

  async function createStaff() {
    if (!form.name || !form.email || !form.password) {
      toast({ title: "Missing Fields", variant: "destructive" });
      return;
    }
    setActionLoading("create");
    try {
      const roleCount = staff.filter((s) => s.role === form.role).length;
      const secretKey = generateSecretKey(form.role, roleCount);

      const { data: { session: adminSession } } = await supabase.auth.getSession();
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (authErr) throw authErr;
      if (!authData.user) throw new Error("Failed to create user");
      if (adminSession) {
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        });
      }

      await supabase.from("profiles").insert({
        id: authData.user.id,
        role: form.role,
        email: form.email,
        name: form.name,
        secret_key: secretKey,
        status: "active",
      });

      toast({ title: "Staff Created", description: `Secret key: ${secretKey}` });
      setShowModal(false);
      setForm({ name: "", email: "", role: "teacher", password: "" });
      loadStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  }

  async function toggleStaff(id: string, currentStatus: string) {
    const newStatus = currentStatus === "disabled" ? "active" : "disabled";
    await supabase.from("profiles").update({ status: newStatus }).eq("id", id);
    toast({ title: `Staff ${newStatus === "active" ? "Enabled" : "Disabled"}` });
    loadStaff();
  }

  async function deleteStaff(s: Profile) {
    if (!confirm(`Delete ${s.name}? Their profile will be archived to trash.`)) return;
    setActionLoading(s.id);
    const { error: deleteErr } = await supabase.from("profiles").delete().eq("id", s.id);
    if (deleteErr) {
      toast({ title: "Delete Failed", description: deleteErr.message, variant: "destructive" });
      setActionLoading(null);
      return;
    }
    await supabase.from("deleted_profiles").insert({ ...s, deleted_at: new Date().toISOString() });
    toast({ title: "Staff Deleted", description: "Profile archived to trash." });
    loadStaff();
    setActionLoading(null);
  }

  const roleColors: Record<string, string> = {
    admin: "bg-purple-500/15 text-purple-600 border-purple-500/30",
    teacher: "bg-green-500/15 text-green-600 border-green-500/30",
    mess_owner: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teachers & Staff</h1>
          <p className="text-sm text-muted-foreground">Manage staff accounts and secret keys</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <Plus className="w-4 h-4 mr-2" />Add Staff
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {staff.length === 0 && <div className="text-center py-12 text-muted-foreground">No staff added yet</div>}
          {staff.map((s) => (
            <Card key={s.id} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{s.name}</span>
                        <Badge className={`text-xs ${roleColors[s.role] || ""}`}>{s.role.replace("_", " ")}</Badge>
                        {s.status === "disabled" && <Badge className="text-xs bg-red-500/15 text-red-600 border-red-500/30">Disabled</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                      {s.secret_key && (
                        <div className="text-xs font-mono text-primary mt-0.5">Secret Key: {s.secret_key}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleStaff(s.id, s.status)}>
                      {s.status === "disabled" ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-orange-500" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteStaff(s)} disabled={actionLoading === s.id}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Full Name *</Label>
              <Input className="mt-1.5" placeholder="Staff Member Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input className="mt-1.5" type="email" placeholder="staff@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="mess_owner">Mess Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Password *</Label>
              <Input className="mt-1.5" type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">A unique secret key (e.g., TEACH-001) will be auto-generated.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={createStaff} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white" disabled={actionLoading === "create"}>
              {actionLoading === "create" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
