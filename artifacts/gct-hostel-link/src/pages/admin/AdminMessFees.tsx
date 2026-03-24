import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle, XCircle, Search, Edit2, Check, Download, AlertTriangle } from "lucide-react";
import { formatPKR, formatDate } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportUtils";

interface FeeRecord {
  id: string;
  student_id: string;
  month: string;
  amount: number;
  status: "paid" | "unpaid";
  paid_at?: string;
  profiles?: { name: string; roll_number: string; hostel: string };
}

export default function AdminMessFees() {
  const { toast } = useToast();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [toggleModal, setToggleModal] = useState<FeeRecord | null>(null);
  const [toggling, setToggling] = useState(false);

  function handleExport() {
    const rows = filtered.map((f) => ({
      Name: f.profiles?.name || "",
      "Roll Number": f.profiles?.roll_number || "",
      Hostel: f.profiles?.hostel || "",
      Month: f.month,
      "Amount (PKR)": f.amount,
      Status: f.status,
      "Paid At": f.paid_at ? formatDate(f.paid_at) : "",
    }));
    exportToCSV(rows, `mess_fees_${filterMonth}`);
  }

  async function loadFees() {
    setLoading(true);
    let q = supabase.from("mess_fees").select("*, profiles(name, roll_number, hostel)");
    if (filterMonth) q = q.eq("month", filterMonth);
    const { data } = await q.order("created_at", { ascending: false });
    setFees(data || []);
    setLoading(false);
  }

  useEffect(() => { loadFees(); }, [filterMonth]);

  async function confirmToggleStatus() {
    if (!toggleModal) return;
    setToggling(true);
    const fee = toggleModal;
    const newStatus = fee.status === "paid" ? "unpaid" : "paid";
    const { error } = await supabase.from("mess_fees").update({
      status: newStatus,
      paid_at: newStatus === "paid" ? new Date().toISOString() : null,
    }).eq("id", fee.id);
    if (error) {
      toast({ title: "Update Failed", description: "Could not update fee status. Please try again.", variant: "destructive" });
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("audit_logs").insert({
        table_name: "mess_fees", record_id: fee.id,
        field_name: "status", old_value: fee.status, new_value: newStatus, changed_by: user?.id,
      });
      toast({ title: `Marked as ${newStatus}`, description: `${fee.profiles?.name} — ${fee.month}` });
    }
    setToggling(false);
    setToggleModal(null);
    loadFees();
  }

  async function saveAmount(id: string, oldAmount: number) {
    const num = parseFloat(editAmount);
    if (isNaN(num) || num <= 0) {
      toast({ title: "Invalid amount", description: "Amount must be greater than 0.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("mess_fees").update({ amount: num }).eq("id", id);
    if (error) {
      toast({ title: "Update Failed", description: "Could not save amount. Please try again.", variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      table_name: "mess_fees", record_id: id,
      field_name: "amount", old_value: String(oldAmount), new_value: String(num), changed_by: user?.id,
    });
    toast({ title: "Amount Updated", description: `Updated to ${formatPKR(num)}` });
    setEditingId(null);
    loadFees();
  }

  const filtered = fees.filter((f) => {
    const matchSearch = !search ||
      (f.profiles?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.profiles?.roll_number || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const newStatus = toggleModal?.status === "paid" ? "unpaid" : "paid";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mess Fees Control</h1>
          <p className="text-sm text-muted-foreground">Admin can edit any fee record — all changes are logged</p>
        </div>
        <div className="flex gap-2">
          <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />CSV
          </Button>
        </div>
      </div>

      <Card className="border border-border mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name or roll number..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex gap-4 text-sm">
        <span className="text-muted-foreground">Total: <strong className="text-foreground">{filtered.length}</strong></span>
        <span className="text-green-600">Paid: <strong>{filtered.filter(f => f.status === "paid").length}</strong></span>
        <span className="text-red-600">Unpaid: <strong>{filtered.filter(f => f.status === "unpaid").length}</strong></span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">No fee records found</div>}
          {filtered.map((f) => (
            <Card key={f.id} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {f.profiles?.name?.charAt(0) || "S"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-foreground">{f.profiles?.name}</div>
                      <div className="text-xs text-muted-foreground">{f.profiles?.roll_number} • {f.profiles?.hostel} Hostel</div>
                      {f.paid_at && <div className="text-xs text-muted-foreground">Paid: {formatDate(f.paid_at)}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {editingId === f.id ? (
                      <>
                        <Input type="number" className="w-28 h-8 text-xs" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} min="1" />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => saveAmount(f.id, f.amount)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingId(null)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-foreground">{formatPKR(f.amount)}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(f.id); setEditAmount(String(f.amount)); }}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                    <Badge className={`text-xs ${f.status === "paid" ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-red-500/15 text-red-600 border-red-500/30"}`}>
                      {f.status}
                    </Badge>
                    <Button size="icon" variant="ghost" className="h-8 w-8" title={f.status === "paid" ? "Reverse to unpaid" : "Mark as paid"} onClick={() => setToggleModal(f)}>
                      {f.status === "paid" ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status Toggle Confirmation */}
      <Dialog open={!!toggleModal} onOpenChange={(open) => { if (!open) setToggleModal(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${newStatus === "unpaid" ? "text-red-600" : "text-green-600"}`}>
              <AlertTriangle className="w-5 h-5" />
              {newStatus === "paid" ? "Mark as Paid?" : "Reverse Payment?"}
            </DialogTitle>
          </DialogHeader>
          {toggleModal && (
            <div className="space-y-3 py-2">
              <div className={`rounded-lg p-3 text-sm ${newStatus === "unpaid" ? "bg-red-500/10 border border-red-500/30" : "bg-green-500/10 border border-green-500/30"}`}>
                <p className="font-medium text-foreground">{toggleModal.profiles?.name}</p>
                <p className="text-xs text-muted-foreground">{toggleModal.profiles?.roll_number} • {toggleModal.month}</p>
                <p className="font-semibold mt-1">{formatPKR(toggleModal.amount)}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Status will change from <strong>{toggleModal.status}</strong> → <strong className={newStatus === "paid" ? "text-green-600" : "text-red-600"}>{newStatus}</strong>. This action is logged in the audit trail.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleModal(null)}>Cancel</Button>
            <Button
              onClick={confirmToggleStatus}
              disabled={toggling}
              className={newStatus === "unpaid" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}>
              {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : `Confirm — Mark ${newStatus}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
