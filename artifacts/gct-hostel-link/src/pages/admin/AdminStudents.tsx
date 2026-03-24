import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { Search, Plus, CheckCircle, XCircle, Edit2, Trash2, Loader2, UserCheck, Eye, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportUtils";

export default function AdminStudents() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterHostel, setFilterHostel] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    name: "", father_name: "", roll_number: "", technology: "",
    room_no: "", shift: "1st", hostel: "Jinnah", email: "",
    phone: "", father_phone: "", address: "", password: ""
  });

  async function loadStudents() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("created_at", { ascending: false });
    setStudents(data || []);
    setLoading(false);
  }

  useEffect(() => { loadStudents(); }, []);

  async function approveStudent(id: string) {
    setActionLoading(id);
    const { error } = await supabase
      .from("profiles")
      .update({ status: "active" })
      .eq("id", id);
    if (!error) {
      toast({ title: "Student Approved", description: "Account is now active." });
      await logAudit("profiles", id, "status", "pending", "active");
      loadStudents();
    }
    setActionLoading(null);
  }

  async function disableStudent(id: string, currentStatus: string) {
    const newStatus = currentStatus === "disabled" ? "active" : "disabled";
    setActionLoading(id);
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", id);
    if (!error) {
      toast({ title: `Student ${newStatus === "active" ? "Enabled" : "Disabled"}` });
      await logAudit("profiles", id, "status", currentStatus, newStatus);
      loadStudents();
    }
    setActionLoading(null);
  }

  async function deleteStudent(student: Profile) {
    if (!confirm(`Delete ${student.name}? Their profile data will be moved to trash.`)) return;
    setActionLoading(student.id);
    const { error: trashErr } = await supabase.from("deleted_profiles").insert({
      ...student, deleted_at: new Date().toISOString()
    });
    if (trashErr) {
      toast({ title: "Error", description: trashErr.message, variant: "destructive" });
      setActionLoading(null);
      return;
    }
    await supabase.from("profiles").delete().eq("id", student.id);
    toast({ title: "Student Deleted", description: "Profile moved to trash. Remove from Supabase Auth manually if needed." });
    loadStudents();
    setActionLoading(null);
  }

  async function createStudent() {
    if (!createForm.name || !createForm.email || !createForm.roll_number || !createForm.password) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    setActionLoading("create");
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: createForm.email,
        password: createForm.password,
      });
      if (authErr) throw authErr;
      if (!authData.user) throw new Error("Failed to create auth user");

      await supabase.from("profiles").insert({
        id: authData.user.id,
        role: "student",
        status: "active",
        email: createForm.email,
        name: createForm.name,
        father_name: createForm.father_name,
        roll_number: createForm.roll_number,
        technology: createForm.technology,
        room_no: createForm.room_no,
        shift: createForm.shift,
        hostel: createForm.hostel,
        phone: createForm.phone,
        father_phone: createForm.father_phone,
        address: createForm.address,
      });

      toast({ title: "Student Created", description: "Account is now active." });
      setShowCreateModal(false);
      setCreateForm({ name: "", father_name: "", roll_number: "", technology: "", room_no: "", shift: "1st", hostel: "Jinnah", email: "", phone: "", father_phone: "", address: "", password: "" });
      loadStudents();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  }

  function handleExport() {
    const rows = filtered.map((s) => ({
      Name: s.name,
      "Father Name": s.father_name || "",
      "Roll Number": s.roll_number || "",
      Technology: s.technology || "",
      "Room No": s.room_no || "",
      Shift: s.shift || "",
      Hostel: s.hostel || "",
      Email: s.email,
      Phone: s.phone || "",
      "Father Phone": s.father_phone || "",
      Address: s.address || "",
      Status: s.status,
      Joined: formatDate(s.created_at),
    }));
    exportToCSV(rows, "students");
  }

  async function logAudit(table: string, recordId: string, field: string, oldVal: string, newVal: string) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      table_name: table, record_id: recordId, field_name: field,
      old_value: oldVal, new_value: newVal, changed_by: user?.id
    });
  }

  const filtered = students.filter((s) => {
    const matchSearch = search === "" || s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.roll_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.technology || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    const matchHostel = filterHostel === "all" || s.hostel === filterHostel;
    return matchSearch && matchStatus && matchHostel;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "bg-green-500/15 text-green-600 border-green-500/30",
      pending: "bg-orange-500/15 text-orange-600 border-orange-500/30",
      disabled: "bg-red-500/15 text-red-600 border-red-500/30",
    };
    return <Badge className={`text-xs ${map[status] || ""}`}>{status}</Badge>;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students Management</h1>
          <p className="text-sm text-muted-foreground">{students.length} total students</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
          <Button onClick={() => setShowCreateModal(true)} size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <Plus className="w-4 h-4 mr-2" />Add Student
          </Button>
        </div>
      </div>

      <Card className="border border-border mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, roll no, technology..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterHostel} onValueChange={setFilterHostel}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Hostel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hostels</SelectItem>
                <SelectItem value="Jinnah">Jinnah</SelectItem>
                <SelectItem value="Iqbal">Iqbal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">No students found</div>}
          {filtered.map((s) => (
            <Card key={s.id} className="border border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{s.name}</span>
                        {statusBadge(s.status)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {s.roll_number} • {s.hostel} Hostel • Room {s.room_no} • Shift {s.shift}
                      </div>
                      <div className="text-xs text-muted-foreground">{s.technology} • {s.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedStudent(s)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {s.status === "pending" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => approveStudent(s.id)} disabled={actionLoading === s.id}>
                        {actionLoading === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                    )}
                    {s.status !== "pending" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => disableStudent(s.id, s.status)} disabled={actionLoading === s.id}>
                        {s.status === "disabled" ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-orange-500" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteStudent(s)} disabled={actionLoading === s.id}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Student Details</DialogTitle></DialogHeader>
          {selectedStudent && (
            <div className="space-y-3 text-sm">
              {[
                ["Name", selectedStudent.name], ["Father's Name", selectedStudent.father_name],
                ["Roll Number", selectedStudent.roll_number], ["Technology", selectedStudent.technology],
                ["Room No", selectedStudent.room_no], ["Shift", selectedStudent.shift],
                ["Hostel", selectedStudent.hostel], ["Email", selectedStudent.email],
                ["Phone", selectedStudent.phone], ["Father's Phone", selectedStudent.father_phone],
                ["Address", selectedStudent.address], ["Status", selectedStudent.status],
                ["Joined", formatDate(selectedStudent.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground capitalize">{value || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Student</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {[
              { label: "Full Name *", key: "name", placeholder: "Muhammad Ali" },
              { label: "Father's Name *", key: "father_name", placeholder: "Muhammad Khan" },
              { label: "Roll Number *", key: "roll_number", placeholder: "232R012" },
              { label: "Technology *", key: "technology", placeholder: "Computer Science" },
              { label: "Room No *", key: "room_no", placeholder: "101" },
              { label: "Email *", key: "email", placeholder: "student@email.com", type: "email" },
              { label: "Phone *", key: "phone", placeholder: "03xx-xxxxxxx" },
              { label: "Father's Phone *", key: "father_phone", placeholder: "03xx-xxxxxxx" },
              { label: "Password *", key: "password", placeholder: "Min 6 chars", type: "password" },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input className="mt-1" type={type || "text"} placeholder={placeholder}
                  value={(createForm as any)[key]} onChange={(e) => setCreateForm({ ...createForm, [key]: e.target.value })} />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label className="text-xs">Address *</Label>
              <Input className="mt-1" placeholder="City, District, Province" value={createForm.address}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Shift</Label>
              <Select value={createForm.shift} onValueChange={(v) => setCreateForm({ ...createForm, shift: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st">1st (Morning)</SelectItem>
                  <SelectItem value="2nd">2nd (Evening)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Hostel</Label>
              <Select value={createForm.hostel} onValueChange={(v) => setCreateForm({ ...createForm, hostel: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jinnah">Jinnah Hostel</SelectItem>
                  <SelectItem value="Iqbal">Iqbal Hostel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={createStudent} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white" disabled={actionLoading === "create"}>
              {actionLoading === "create" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
