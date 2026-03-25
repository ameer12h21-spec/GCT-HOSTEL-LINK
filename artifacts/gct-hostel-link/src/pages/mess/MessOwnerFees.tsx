import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { Loader2, Save, CheckCircle, XCircle, Search, DollarSign, Edit2, Download, AlertTriangle } from "lucide-react";
import { formatPKR } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportUtils";
import { NetworkWarningBanner } from "@/components/NetworkIndicator";

interface FeeRecord {
  id?: string;
  student_id: string;
  month: string;
  amount: number;
  status: "paid" | "unpaid";
  paid_at?: string;
}

export default function MessOwnerFees() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Profile[]>([]);
  const [fees, setFees] = useState<Record<string, FeeRecord>>({});
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [globalAmount, setGlobalAmount] = useState("7780");
  const [settingGlobal, setSettingGlobal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<Profile | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payAmountError, setPayAmountError] = useState("");
  const [reverseModal, setReverseModal] = useState<{ student: Profile; fee: FeeRecord } | null>(null);
  const [reversing, setReversing] = useState(false);

  async function load() {
    setLoading(true);
    const [studentsRes, feesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "student").eq("status", "active").order("name"),
      supabase.from("mess_fees").select("*").eq("month", month),
    ]);
    const feeMap: Record<string, FeeRecord> = {};
    (feesRes.data || []).forEach((f) => { feeMap[f.student_id] = { ...f, amount: Number(f.amount) }; });
    setStudents(studentsRes.data || []);
    setFees(feeMap);
    setLoading(false);
  }

  useEffect(() => { load(); }, [month]);

  function handleExport() {
    const rows = filtered.map((s) => ({
      Name: s.name,
      "Roll Number": s.roll_number || "",
      Hostel: s.hostel || "",
      Month: month,
      "Amount (PKR)": fees[s.id]?.amount ?? 0,
      Status: fees[s.id]?.status || "unpaid",
      "Paid At": fees[s.id]?.paid_at || "",
    }));
    exportToCSV(rows, `mess_fees_${month}`);
  }

  async function setGlobalFee(overrideAll = false) {
    const amt = parseFloat(globalAmount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount greater than 0.", variant: "destructive" });
      return;
    }
    if (!confirm(`Set mess fee to ${formatPKR(amt)} for ${overrideAll ? "ALL" : "students without a fee set"} for ${month}?`)) return;
    setSettingGlobal(true);
    const { data: { user } } = await supabase.auth.getUser();
    let successCount = 0;
    let failCount = 0;
    for (const s of students) {
      if (!overrideAll && fees[s.id]) continue;
      let err;
      if (fees[s.id]?.id) {
        const res = await supabase.from("mess_fees").update({ amount: amt }).eq("id", fees[s.id].id);
        err = res.error;
      } else {
        const res = await supabase.from("mess_fees").insert({ student_id: s.id, month, amount: amt, status: "unpaid", set_by: user?.id });
        err = res.error;
      }
      if (err) failCount++; else successCount++;
    }
    if (failCount > 0) {
      toast({ title: "Partial Update", description: `${successCount} updated, ${failCount} failed. Please try again.`, variant: "destructive" });
    } else {
      toast({ title: "Global Fee Set", description: `${formatPKR(amt)} applied to ${successCount} student(s)` });
    }
    setSettingGlobal(false);
    load();
  }

  async function markPayment(student: Profile, amountStr: string) {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setPayAmountError("Amount must be greater than 0.");
      return;
    }
    if (amount > 999999) {
      setPayAmountError("Amount seems too high. Please verify.");
      return;
    }
    setPayAmountError("");
    setSubmitting(student.id);
    const { data: { user } } = await supabase.auth.getUser();
    let error;
    if (fees[student.id]?.id) {
      const res = await supabase.from("mess_fees").update({
        status: "paid",
        amount,
        paid_at: new Date().toISOString(),
        marked_by: user?.id,
      }).eq("id", fees[student.id].id);
      error = res.error;
    } else {
      const res = await supabase.from("mess_fees").insert({
        student_id: student.id,
        month,
        amount,
        status: "paid",
        paid_at: new Date().toISOString(),
        set_by: user?.id,
        marked_by: user?.id,
      });
      error = res.error;
    }
    if (error) {
      toast({
        title: "Payment Failed",
        description: "Could not save payment. Please try again. No changes were made.",
        variant: "destructive",
      });
    } else {
      await supabase.from("audit_logs").insert({
        table_name: "mess_fees",
        record_id: fees[student.id]?.id || student.id,
        field_name: "status",
        old_value: fees[student.id]?.status || "unpaid",
        new_value: "paid",
        changed_by: user?.id,
      });
      toast({ title: "Payment Recorded", description: `${student.name}: ${formatPKR(amount)} — Paid` });
    }
    setPaymentModal(null);
    setSubmitting(null);
    load();
  }

  async function confirmReversePayment() {
    if (!reverseModal) return;
    const { student, fee } = reverseModal;
    setReversing(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("mess_fees").update({
      status: "unpaid",
      paid_at: null,
      marked_by: user?.id,
    }).eq("id", fee.id);
    if (error) {
      toast({ title: "Reversal Failed", description: "Could not reverse payment. Please try again.", variant: "destructive" });
    } else {
      await supabase.from("audit_logs").insert({
        table_name: "mess_fees",
        record_id: fee.id,
        field_name: "status",
        old_value: "paid",
        new_value: "unpaid",
        changed_by: user?.id,
      });
      toast({ title: "Payment Reversed", description: `${student.name}'s payment has been reversed to unpaid.` });
    }
    setReversing(false);
    setReverseModal(null);
    load();
  }

  async function saveIndividualAmount(studentId: string) {
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid amount", description: "Amount must be greater than 0.", variant: "destructive" });
      return;
    }
    const fee = fees[studentId];
    const { data: { user } } = await supabase.auth.getUser();
    let error;
    if (fee?.id) {
      const res = await supabase.from("mess_fees").update({ amount: amt }).eq("id", fee.id);
      error = res.error;
    } else {
      const res = await supabase.from("mess_fees").insert({ student_id: studentId, month, amount: amt, status: "unpaid", set_by: user?.id });
      error = res.error;
    }
    if (error) {
      toast({ title: "Update Failed", description: "Could not save amount. Please try again.", variant: "destructive" });
    } else {
      if (fee?.id) {
        await supabase.from("audit_logs").insert({ table_name: "mess_fees", record_id: fee.id, field_name: "amount", old_value: String(fee.amount), new_value: String(amt), changed_by: user?.id });
      }
      toast({ title: "Amount Updated", description: `Fee set to ${formatPKR(amt)}` });
    }
    setEditingId(null);
    load();
  }

  const filtered = students.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.roll_number || "").toLowerCase().includes(search.toLowerCase());
    const feeStatus = fees[s.id]?.status || "unpaid";
    const matchStatus = filterStatus === "all" || feeStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fees Management</h1>
          <p className="text-sm text-muted-foreground">Set and track mess fees</p>
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
          <p className="text-sm font-medium text-foreground mb-3">Global Fee Settings</p>
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <Input type="number" className="w-32" value={globalAmount} onChange={(e) => setGlobalAmount(e.target.value)} placeholder="7780" min="1" />
            </div>
            <Button onClick={() => setGlobalFee(false)} disabled={settingGlobal} variant="outline" size="sm">
              {settingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set for Unset Students"}
            </Button>
            <Button onClick={() => setGlobalFee(true)} disabled={settingGlobal} size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              {settingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : "Override All Students"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search students..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4 mb-4 text-sm">
        <span className="text-green-600">Paid: <strong>{filtered.filter(s => fees[s.id]?.status === "paid").length}</strong></span>
        <span className="text-red-600">Unpaid: <strong>{filtered.filter(s => fees[s.id]?.status !== "paid").length}</strong></span>
      </div>

      <NetworkWarningBanner />

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const fee = fees[s.id];
            const feeStatus = fee?.status || "unpaid";
            const feeAmount = fee?.amount || parseFloat(globalAmount) || 7780;
            return (
              <Card key={s.id} className="border border-border">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                        {s.profile_photo_url ? <img src={s.profile_photo_url} alt="" className="w-full h-full object-cover" /> : s.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.roll_number} • {s.hostel}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                      {editingId === s.id ? (
                        <>
                          <Input type="number" className="w-24 h-8 text-xs" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} min="1" />
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => saveIndividualAmount(s.id)}>
                            <Save className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingId(null)}>
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-foreground">{formatPKR(feeAmount)}</span>
                          {feeStatus !== "paid" && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(s.id); setEditAmount(String(feeAmount)); }}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                      <Badge className={`text-xs ${feeStatus === "paid" ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-red-500/15 text-red-600 border-red-500/30"}`}>
                        {feeStatus}
                      </Badge>
                      {feeStatus === "unpaid" ? (
                        <Button size="sm" variant="outline" className="text-xs text-green-600 border-green-500/30 hover:bg-green-500/10 h-8"
                          onClick={() => { setPaymentModal(s); setPayAmount(String(feeAmount)); setPayAmountError(""); }}
                          disabled={submitting === s.id}>
                          {submitting === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle className="w-3.5 h-3.5 mr-1" />Mark Paid</>}
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Reverse Payment"
                          onClick={() => fee && setReverseModal({ student: s, fee })}>
                          <XCircle className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment Confirmation Modal */}
      <Dialog open={!!paymentModal} onOpenChange={(open) => { if (!open) { setPaymentModal(null); setPayAmountError(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          {paymentModal && (
            <div className="space-y-4 py-2">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-600">
                Recording payment for <strong className="text-foreground">{paymentModal.name}</strong>
                <div className="text-xs text-muted-foreground mt-0.5">{paymentModal.roll_number} • {paymentModal.hostel} Hostel • {month}</div>
              </div>
              <div>
                <Label>Amount Received (PKR) <span className="text-red-500">*</span></Label>
                <Input
                  className={`mt-1.5 ${payAmountError ? "border-red-500" : ""}`}
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => { setPayAmount(e.target.value); setPayAmountError(""); }}
                  placeholder="Enter amount in PKR"
                />
                {payAmountError && <p className="text-xs text-red-500 mt-1">{payAmountError}</p>}
                <p className="text-xs text-muted-foreground mt-1">Verify the exact cash received before confirming.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPaymentModal(null); setPayAmountError(""); }}>Cancel</Button>
            <Button
              onClick={() => paymentModal && markPayment(paymentModal, payAmount)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              disabled={submitting === paymentModal?.id}>
              {submitting === paymentModal?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Save Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Reversal Confirmation Modal */}
      <Dialog open={!!reverseModal} onOpenChange={(open) => { if (!open) setReverseModal(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5" />Reverse Payment?</DialogTitle></DialogHeader>
          {reverseModal && (
            <div className="space-y-3 py-2">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm">
                <p className="font-medium text-foreground">{reverseModal.student.name}</p>
                <p className="text-xs text-muted-foreground">{reverseModal.student.roll_number} • {reverseModal.fee.month}</p>
                <p className="text-red-600 font-semibold mt-1">{formatPKR(reverseModal.fee.amount)}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                This will mark the payment as <strong className="text-red-600">unpaid</strong> and clear the paid date. This action is logged in audit records.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReverseModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReversePayment} disabled={reversing}>
              {reversing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Reverse Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
