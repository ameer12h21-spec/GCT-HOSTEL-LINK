import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, Download } from "lucide-react";
import { formatPKR, formatDate } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportUtils";

interface PaymentRecord {
  id: string;
  student_id: string;
  month: string;
  amount: number;
  status: string;
  paid_at?: string;
  profiles?: { name: string; roll_number: string; hostel: string };
}

export default function MessOwnerPaymentHistory() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    setLoading(true);
    supabase.from("mess_fees").select("*, profiles(name, roll_number, hostel)")
      .eq("month", month).eq("status", "paid").order("paid_at", { ascending: false })
      .then(({ data }) => { setRecords(data || []); setLoading(false); });
  }, [month]);

  const filtered = records.filter((r) =>
    !search ||
    (r.profiles?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.profiles?.roll_number || "").toLowerCase().includes(search.toLowerCase())
  );

  function handleExport() {
    const rows = filtered.map((r) => ({
      Name: r.profiles?.name || "",
      "Roll Number": r.profiles?.roll_number || "",
      Hostel: r.profiles?.hostel || "",
      Month: r.month,
      "Amount (PKR)": r.amount,
      Status: r.status,
      "Paid At": r.paid_at ? formatDate(r.paid_at) : "",
    }));
    exportToCSV(rows, `payment_history_${month}`);
  }

  const totalCollected = filtered.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment History</h1>
          <p className="text-sm text-muted-foreground">Paid mess fees for the selected month</p>
        </div>
        <div className="flex gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />CSV
          </Button>
        </div>
      </div>

      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Total Collected ({filtered.length} payments)</span>
        <span className="text-xl font-bold text-green-600">{formatPKR(totalCollected)}</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or roll no..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No payments recorded for this month</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id} className="border border-border border-l-4 border-l-green-500">
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {r.profiles?.name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{r.profiles?.name}</div>
                    <div className="text-xs text-muted-foreground">{r.profiles?.roll_number} • {r.profiles?.hostel}</div>
                    {r.paid_at && <div className="text-xs text-muted-foreground">Paid: {formatDate(r.paid_at)}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-semibold text-green-600">{formatPKR(r.amount)}</span>
                  <Badge className="text-xs bg-green-500/15 text-green-600 border-green-500/30">Paid</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
