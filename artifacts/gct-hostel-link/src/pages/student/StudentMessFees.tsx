import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Loader2, DollarSign } from "lucide-react";
import { formatPKR, formatDate } from "@/lib/utils";

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

  useEffect(() => {
    if (!profile) return;
    supabase.from("mess_fees").select("*").eq("student_id", profile.id).order("month", { ascending: false })
      .then(({ data }) => { setFees(data || []); setLoading(false); });
  }, [profile]);

  const totalPaid = fees.filter((f) => f.status === "paid").reduce((sum, f) => sum + f.amount, 0);
  const totalUnpaid = fees.filter((f) => f.status === "unpaid").reduce((sum, f) => sum + f.amount, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mess Fees</h1>
        <p className="text-sm text-muted-foreground">Your mess fee payment history</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="border border-border border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Total Paid</span>
            </div>
            <div className="text-xl font-bold text-green-600">{formatPKR(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card className="border border-border border-red-500/20">
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
                    {f.paid_at && <div className="text-xs text-muted-foreground mt-0.5">Paid on: {formatDate(f.paid_at)}</div>}
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
