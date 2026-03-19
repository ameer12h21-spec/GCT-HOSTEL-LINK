import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { Loader2, Save, Zap, CheckCircle, XCircle } from "lucide-react";
import { formatPKR } from "@/lib/utils";

export default function TeacherElectricity() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Profile[]>([]);
  const [bills, setBills] = useState<Record<string, any>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [globalAmount, setGlobalAmount] = useState("");
  const [settingGlobal, setSettingGlobal] = useState(false);

  async function load() {
    setLoading(true);
    const { data: studs } = await supabase.from("profiles").select("*").eq("role", "student").eq("status", "active").order("name");
    const { data: billData } = await supabase.from("electricity_bills").select("*").eq("month", month);
    const billMap: Record<string, any> = {};
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
    if (isNaN(amt) || amt <= 0) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    setSaving(student.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (bills[student.id]) {
      await supabase.from("electricity_bills").update({ amount: amt }).eq("id", bills[student.id].id);
    } else {
      await supabase.from("electricity_bills").insert({ student_id: student.id, month, amount: amt, status: "unpaid", set_by: user?.id });
    }
    toast({ title: "Bill Updated", description: `${student.name}: ${formatPKR(amt)}` });
    setSaving(null);
    load();
  }

  async function togglePaid(bill: any) {
    const newStatus = bill.status === "paid" ? "unpaid" : "paid";
    await supabase.from("electricity_bills").update({ status: newStatus, paid_at: newStatus === "paid" ? new Date().toISOString() : null }).eq("id", bill.id);
    toast({ title: `Marked as ${newStatus}` });
    load();
  }

  async function setGlobalBill() {
    const amt = parseFloat(globalAmount);
    if (isNaN(amt) || amt <= 0) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    if (!confirm(`Set electricity bill to ${formatPKR(amt)} for ALL students for ${month}?`)) return;
    setSettingGlobal(true);
    const { data: { user } } = await supabase.auth.getUser();
    for (const s of students) {
      if (bills[s.id]) {
        await supabase.from("electricity_bills").update({ amount: amt }).eq("id", bills[s.id].id);
      } else {
        await supabase.from("electricity_bills").insert({ student_id: s.id, month, amount: amt, status: "unpaid", set_by: user?.id });
      }
    }
    toast({ title: "Global Bill Set", description: `${formatPKR(amt)} for all ${students.length} students` });
    setGlobalAmount("");
    setSettingGlobal(false);
    load();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Electricity Bills</h1>
          <p className="text-sm text-muted-foreground">Set monthly bills per student</p>
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
      </div>

      <Card className="border border-border mb-6">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground mb-3">Set Global Amount for All Students</p>
          <div className="flex gap-3">
            <Input type="number" placeholder="Amount in PKR" value={globalAmount} onChange={(e) => setGlobalAmount(e.target.value)} className="flex-1" />
            <Button onClick={setGlobalBill} disabled={settingGlobal} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              {settingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4 mr-2" />Set for All</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
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
                      <Input type="number" className="w-28 h-8 text-xs" placeholder="PKR" value={amounts[s.id] || ""} onChange={(e) => setAmounts({ ...amounts, [s.id]: e.target.value })} />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => setBillForStudent(s)} disabled={saving === s.id}>
                        {saving === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      </Button>
                      {bill && (
                        <>
                          <Badge className={`text-xs ${bill.status === "paid" ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-red-500/15 text-red-600 border-red-500/30"}`}>
                            {bill.status}
                          </Badge>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => togglePaid(bill)}>
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
    </div>
  );
}
