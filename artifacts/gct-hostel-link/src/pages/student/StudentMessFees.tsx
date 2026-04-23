import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Loader2, DollarSign, Download, RefreshCw } from "lucide-react";
import { formatPKR, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/exportUtils";

interface FeeRecord {
  id: string;
  month: string;
  amount: number;
  status: "paid" | "unpaid";
  paid_at?: string;
}

export default function StudentMessFees() {
  const { profile } = useAuth();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("mess_fees").select("*").eq("student_id", profile.id).order("month", { ascending: false });
    if (error) console.error("Mess fees fetch error:", error.message);
    setFees((data || []).map((f) => ({ ...f, amount: Number(f.amount) })));
    setLoading(false);
    setLastUpdated(new Date());
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    load();
    const ch = supabase.channel("student_mess_fees_rt_" + profile.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "mess_fees",
        filter: `student_id=eq.${profile.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile, load]);

  const totalPaid = fees.filter((f) => f.status === "paid").reduce((sum, f) => sum + f.amount, 0);
  const totalUnpaid = fees.filter((f) => f.status === "unpaid").reduce((sum, f) => sum + f.amount, 0);

  function handleExport() {
    const rows = fees.map((f) => ({
      Month: new Date(f.month + "-01").toLocaleDateString("en-PK", { year: "numeric", month: "long" }),
      "Amount (PKR)": f.amount,
      Status: f.status,
      "Paid At": f.paid_at ? formatDate(f.paid_at) : "",
    }));
    exportToCSV(rows, "my_mess_fees");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mess Fees</h1>
          <p className="text-sm text-muted-foreground">Your mess fee payment history</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />Live
            </span>
          )}
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="border border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Total Paid</span>
            </div>
            <div className="text-xl font-bold text-green-600">{formatPKR(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card className="border border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Outstanding</span>
            </div>
            <div className="text-xl font-bold text-red-600">{formatPKR(totalUnpaid)}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : fees.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No fee records found</div>
      ) : (
        <div className="space-y-3">
          {fees.map((f) => (
            <Card key={f.id} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground text-sm">
                      {new Date(f.month + "-01").toLocaleDateString("en-PK", { year: "numeric", month: "long" })}
                    </div>
                    {f.paid_at && (
                      <div className="text-xs text-muted-foreground mt-0.5">Paid on: {formatDate(f.paid_at)}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{formatPKR(f.amount)}</span>
                    <Badge className={`text-xs ${f.status === "paid" ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-red-500/15 text-red-600 border-red-500/30"}`}>
                      {f.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Payment Information</p>
        <p>Mess fees are collected in cash by the mess owner or teacher. Once you pay, they will update your status in the system. Contact the mess owner if you believe there is an error.</p>
      </div>
    </div>
  );
}
