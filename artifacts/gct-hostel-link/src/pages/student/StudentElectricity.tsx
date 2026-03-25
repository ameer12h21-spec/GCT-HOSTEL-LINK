import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Loader2, Zap, Download } from "lucide-react";
import { formatPKR, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/exportUtils";

interface ElecBill {
  id: string;
  month: string;
  amount: number;
  status: "paid" | "unpaid";
  paid_at?: string;
}

export default function StudentElectricity() {
  const { profile } = useAuth();
  const [bills, setBills] = useState<ElecBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase.from("electricity_bills").select("*").eq("student_id", profile.id).order("month", { ascending: false })
      .then(({ data }) => {
        // Cast numeric fields — Supabase returns numeric as string
        setBills((data || []).map((b) => ({ ...b, amount: Number(b.amount) })));
        setLoading(false);
      });
  }, [profile]);

  const totalPaid = bills.filter((b) => b.status === "paid").reduce((sum, b) => sum + b.amount, 0);
  const totalUnpaid = bills.filter((b) => b.status === "unpaid").reduce((sum, b) => sum + b.amount, 0);

  function handleExport() {
    const rows = bills.map((b) => ({
      Month: new Date(b.month + "-01").toLocaleDateString("en-PK", { year: "numeric", month: "long" }),
      "Amount (PKR)": b.amount,
      Status: b.status,
      "Paid At": b.paid_at ? formatDate(b.paid_at) : "",
    }));
    exportToCSV(rows, "my_electricity_bills");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Electricity Bills</h1>
          <p className="text-sm text-muted-foreground">Monthly electricity bills set by teacher</p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-1" />CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="border border-border border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Total Paid</span>
            </div>
            <div className="text-xl font-bold text-green-600">{formatPKR(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card className="border border-border border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Outstanding</span>
            </div>
            <div className="text-xl font-bold text-red-600">{formatPKR(totalUnpaid)}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : bills.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No electricity bill records yet</div>
      ) : (
        <div className="space-y-3">
          {bills.map((b) => (
            <Card key={b.id} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground text-sm">
                      {new Date(b.month + "-01").toLocaleDateString("en-PK", { year: "numeric", month: "long" })}
                    </div>
                    {b.paid_at && <div className="text-xs text-muted-foreground mt-0.5">Paid: {formatDate(b.paid_at)}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{formatPKR(b.amount)}</span>
                    <Badge className={`text-xs ${b.status === "paid" ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-red-500/15 text-red-600 border-red-500/30"}`}>
                      {b.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm">
        <p className="font-medium text-foreground mb-1">Important</p>
        <p className="text-muted-foreground">Electricity bills are set by teachers each month. Bills are final once set. If you believe there is an error, contact the teacher or submit a complaint.</p>
      </div>
    </div>
  );
}
