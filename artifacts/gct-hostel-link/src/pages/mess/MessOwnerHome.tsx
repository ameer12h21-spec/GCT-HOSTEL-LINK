import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { DollarSign, CheckCircle, XCircle, Users } from "lucide-react";
import { formatPKR } from "@/lib/utils";

export default function MessOwnerHome() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ totalStudents: 0, paid: 0, unpaid: 0, totalCollected: 0 });

  useEffect(() => {
    async function load() {
      const month = new Date().toISOString().slice(0, 7);
      const [studentsRes, feesRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }).eq("role", "student").eq("status", "active"),
        supabase.from("mess_fees").select("status, amount").eq("month", month),
      ]);
      const fees = feesRes.data || [];
      const paid = fees.filter((f) => f.status === "paid");
      setStats({
        totalStudents: studentsRes.count || 0,
        paid: paid.length,
        unpaid: fees.filter((f) => f.status === "unpaid").length,
        totalCollected: paid.reduce((sum, f) => sum + Number(f.amount), 0),
      });
    }
    load();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mess Owner Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome, {profile?.name} — {new Date().toLocaleDateString("en-PK", { month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Students", value: stats.totalStudents, color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: CheckCircle, label: "Fees Paid", value: stats.paid, color: "text-green-500", bg: "bg-green-500/10" },
          { icon: XCircle, label: "Fees Unpaid", value: stats.unpaid, color: "text-red-500", bg: "bg-red-500/10" },
          { icon: DollarSign, label: "Collected (PKR)", value: formatPKR(stats.totalCollected), color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`font-bold text-foreground ${typeof s.value === "number" ? "text-2xl" : "text-lg"}`}>{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
