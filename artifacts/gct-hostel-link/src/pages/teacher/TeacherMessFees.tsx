import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, Download, AlertCircle } from "lucide-react";
import { formatPKR } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportUtils";

interface FeeRecord {
  id: string;
  student_id: string;
  month: string;
  amount: number;
  status: "paid" | "unpaid";
  profiles?: { name: string; roll_number: string; hostel: string } | null;
}

export default function TeacherMessFees() {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setQueryError(null);

    async function load() {
      // Step 1: fetch all fees for the month (no join — avoids RLS recursion on profiles)
      const { data: feesData, error: feesError } = await supabase
        .from("mess_fees")
        .select("id, student_id, month, amount, status")
        .eq("month", month)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (feesError) {
        setQueryError(feesError.message);
        setFees([]);
        setLoading(false);
        return;
      }

      const rawFees = feesData || [];

      if (rawFees.length === 0) {
        setFees([]);
        setLoading(false);
        return;
      }

      // Step 2: fetch profiles separately
      const studentIds = rawFees.map((f) => f.student_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, roll_number, hostel")
        .in("id", studentIds);

      if (cancelled) return;

      const profileMap: Record<string, { name: string; roll_number: string; hostel: string }> = {};
      (profilesData || []).forEach((p) => { profileMap[p.id] = p; });

      // Step 3: merge + cast numeric amount
      const merged: FeeRecord[] = rawFees.map((f) => ({
        ...f,
        amount: Number(f.amount),
        profiles: profileMap[f.student_id] || null,
      }));

      setFees(merged);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [month]);

  const filtered = fees.filter((f) =>
    !search ||
    (f.profiles?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (f.profiles?.roll_number || "").toLowerCase().includes(search.toLowerCase())
  );

  function handleExport() {
    const rows = filtered.map((f) => ({
      Name: f.profiles?.name || "",
      "Roll Number": f.profiles?.roll_number || "",
      Hostel: f.profiles?.hostel || "",
      Month: f.month,
      "Amount (PKR)": f.amount,
      Status: f.status,
    }));
    exportToCSV(rows, `mess_fees_${month}`);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mess Fees (View Only)</h1>
          <p className="text-sm text-muted-foreground">Fee records are managed by Mess Owner</p>
        </div>
        <div className="flex gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />CSV
          </Button>
        </div>
      </div>

      {queryError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Could not load fees: {queryError}</span>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-4 mb-4 text-sm">
        <span className="text-green-600">Paid: <strong>{filtered.filter(f => f.status === "paid").length}</strong></span>
        <span className="text-red-600">Unpaid: <strong>{filtered.filter(f => f.status === "unpaid").length}</strong></span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No fees recorded for {month}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => (
            <Card key={f.id} className="border border-border">
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    {(f.profiles?.name || "?").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{f.profiles?.name || "Unknown Student"}</div>
                    <div className="text-xs text-muted-foreground">{f.profiles?.roll_number || "—"} • {f.profiles?.hostel || "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-semibold text-foreground">{formatPKR(f.amount)}</span>
                  <Badge className={`text-xs ${f.status === "paid" ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-red-500/15 text-red-600 border-red-500/30"}`}>
                    {f.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
