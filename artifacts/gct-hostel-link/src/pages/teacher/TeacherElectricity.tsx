import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { Loader2, Save, Zap, CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react";
import { formatPKR } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportUtils";
import { NetworkWarningBanner } from "@/components/NetworkIndicator";

interface Bill {
  id: string;
  student_id: string;
  month: string;
  amount: number;
  status: "paid" | "unpaid";
  paid_at?: string;
}

export default function TeacherElectricity() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Profile[]>([]);
  const [bills, setBills] = useState<Record<string, Bill>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [globalAmount, setGlobalAmount] = useState("");
  const [settingGlobal, setSettingGlobal] = useState(false);
  const [toggleModal, setToggleModal] = useState<{ student: Profile; bill: Bill } | null>(null);
  const [toggling, setToggling] = useState(false);

  async function load() {
    setLoading(true);
    const { data: studs } = await supabase.from("profiles").select("*").eq("role", "student").eq("status", "active").order("name");
    const { data: billData } = await supabase.from("electricity_bills").select("*").eq("month", month);
    const billMap: Record<string, Bill> = {};
    const amountMap: Record<string, string> = {};
    (billData || []).forEach((b) => { billMap[b.student_id] = b; amountMap[b.student_id] = String(b.amount); });
    setStudents(studs || []);
    setBills(billMap);
    setAmounts(amountMap);
    setLoading(false);
  }

  useEffect(() => { load(); }, [month]);

  async function setBillForStudent(student: Profile) {
    const amt = parseFloat(amounts[student.id] || "0");
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid amount", description: "Amount must be greater than 0.", variant: "destructive" });
      return;
    }
    setSaving(student.id);
    const { data: { user } } = await supabase.auth.getUser();
    let error;
    if (bills[student.id]) {
      const res = await supabase.from("electricity_bills").update({ amount: amt }).eq("id", bills[student.id].id);
      error = res.error;
    } else {
      const res = await supabase.from("electricity_bills").insert({ student_id: student.id, month, amount: amt, status: "unpaid", set_by: user?.id });
      error = res.error;
    }
    if (error) {
      toast({ title: "Save Failed", description: "Could not save bill. Please try again.", variant: "destructive" });
    } else {
      toast({ title: "Bill Updated", description: `${student.name}: ${formatPKR(amt)}` });
    }
    setSaving(null);
    load();
  }

  async function confirmTogglePaid() {
    if (!toggleModal) return;
    const { student, bill } = toggleModal;
    setToggling(true);
    const newStatus = bill.status === "paid" ? "unpaid" : "paid";
    const { error } = await supabase.from("electricity_bills").update({
      status: newStatus,
      paid_at: newStatus === "paid" ? new Date().toISOString() : null,
    }).eq("id", bill.id);
    if (error) {
      toast({ title: "Update Failed", description: "Could not update bill status. Please try again.", variant: "destructive" });
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("audit_logs").insert({
        table_name: "electricity_bills", record_id: bill.id,
        field_name: "status", old_value: bill.status, new_value: newStatus, changed_by: user?.id,
      });
      toast({ title: `Marked as ${newStatus}`, description: `${student.name} — ${bill.month}` });
    }
    setToggling(false);
    setToggleModal(null);
    load();
  }

  async function setGlobalBill() {
    const amt = parseFloat(globalAmount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid amount", description: "Amount must be greater than 0.", variant: "destructive" });
      return;
    }
    if (!confirm(`Set electricity bill to ${formatPKR(amt)} for ALL ${students.length} students for ${month}?`)) return;
    setSettingGlobal(true);
    const { data: { user } } = await supabase.auth.getUser();
    let successCount = 0;
    let failCount = 0;
    for (const s of students) {
      let err;
      if (bills[s.id]) {
        const res = await supabase.from("electricity_bills").update({ amount: amt }).eq("id", bills[s.id].id);
        err = res.error;
      } else {
        const res = await supabase.from("electricity_bills").insert({ student_id: s.id, month, amount: amt, status: "unpaid", set_by: user?.id });
        err = res.error;
      }
      if (err) failCount++; else successCount++;
    }
    if (failCount > 0) {
      toast({ title: "Partial Update", description: `${successCount} updated, ${failCount} failed.`, variant: "destructive" });
    } else {
      toast({ title: "Global Bill Set", description: `${formatPKR(amt)} for all ${successCount} students` });
    }
    setGlobalAmount("");
    setSettingGlobal(false);
    load();
  }

  function handleExport() {
    const rows = students.map((s) => ({
      Name: s.name,
      "Roll Number": s.roll_number || "",
      Hostel: s.hostel || "",
      Month: month,
      "Amount (PKR)": bills[s.id]?.amount ?? "Not Set",
      Status: bills[s.id]?.status || "not set",
    }));
    exportToCSV(rows, `electricity_bills_${month}`);
  }

  const newToggleStatus = toggleModal?.bill.status === "paid" ? "unpaid" : "paid";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Electricity Bills</h1>
          <p className="text-sm text-muted-foreground">Set monthly bills per student</p>
        </div>
        <div className="flex gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />CSV
          </Button>
        </div>
      </div>

      <Card className="border border-border mb-6">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground mb-3">Set Global Amount for All Students</p>
          <div className="flex gap-3">
            <Input type="number" placeholder="Amount in PKR" value={globalAmount} onChange={(e) => setGlobalAmount(e.target.value)} className="flex-1" min="1" />
            <Button onClick={setGlobalBill} disabled={settingGlobal} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              {settingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4 mr-2" />Set for All</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <NetworkWarningBanner />

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {students.length === 0 && <div className="text-center py-12 text-muted-foreground">No active students</div>}
          {students.map((s) => {
            const bill = bills[s.id];
            return (
              <Card key={s.id} className="border border-border">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.roll_number} • {s.hostel}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Input type="number" className="w-28 h-8 text-xs" placeholder="PKR" value={amounts[s.id] || ""}
                        onChange={(e) => setAmounts({ ...amounts, [s.id]: e.target.value })} min="1" />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => setBillForStudent(s)} disabled={saving === s.id}>
                        {saving === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      </Button>
                      {bill && (
                        <>
                          <Badge className={`text-xs ${bill.status === "paid" ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-red-500/15 text-red-600 border-red-500/30"}`}>
                            {bill.status}
                          </Badge>
                          <Button size="icon" variant="ghost" className="h-8 w-8"
                            title={bill.status === "paid" ? "Reverse to unpaid" : "Mark as paid"}
                            onClick={() => setToggleModal({ student: s, bill })}>
                            {bill.status === "paid" ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Status Toggle Confirmation */}
      <Dialog open={!!toggleModal} onOpenChange={(open) => { if (!open) setToggleModal(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${newToggleStatus === "unpaid" ? "text-red-600" : "text-green-600"}`}>
              <AlertTriangle className="w-5 h-5" />
              {newToggleStatus === "paid" ? "Mark as Paid?" : "Reverse Payment?"}
            </DialogTitle>
          </DialogHeader>
          {toggleModal && (
            <div className="space-y-3 py-2">
              <div className={`rounded-lg p-3 text-sm ${newToggleStatus === "unpaid" ? "bg-red-500/10 border border-red-500/30" : "bg-green-500/10 border border-green-500/30"}`}>
                <p className="font-medium text-foreground">{toggleModal.student.name}</p>
                <p className="text-xs text-muted-foreground">{toggleModal.student.roll_number} • {toggleModal.bill.month}</p>
                <p className="font-semibold mt-1">{formatPKR(toggleModal.bill.amount)}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Status: <strong>{toggleModal.bill.status}</strong> → <strong className={newToggleStatus === "paid" ? "text-green-600" : "text-red-600"}>{newToggleStatus}</strong>. This action is logged in the audit trail.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleModal(null)}>Cancel</Button>
            <Button
              onClick={confirmTogglePaid}
              disabled={toggling}
              className={newToggleStatus === "unpaid" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}>
              {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : `Confirm — Mark ${newToggleStatus}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
