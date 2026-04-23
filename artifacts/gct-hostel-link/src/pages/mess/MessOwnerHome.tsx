import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { DollarSign, CheckCircle, XCircle, Users, RefreshCw } from "lucide-react";
import { formatPKR } from "@/lib/utils";

export default function MessOwnerHome() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ totalStudents: 0, paid: 0, unpaid: 0, totalCollected: 0 });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
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
      unpaid: fees.filter((f) => f.status !== "paid").length,
      totalCollected: paid.reduce((sum, f) => sum + Number(f.amount), 0),
    });
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    load();
    // Real-time: refresh stats on any fee or student profile change
    const ch = supabase.channel("mess_owner_home_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "mess_fees" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mess Owner Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome, {profile?.name} — {new Date().toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
          </p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <RefreshCw className="w-3 h-3" />
            Live · {lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        )}
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
