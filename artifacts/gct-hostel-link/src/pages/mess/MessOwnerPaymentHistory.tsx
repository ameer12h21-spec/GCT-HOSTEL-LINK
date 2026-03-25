import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, Download, RefreshCw, AlertCircle } from "lucide-react";
import { formatPKR, formatDate } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportUtils";
import { NetworkWarningBanner } from "@/components/NetworkIndicator";

interface PaymentRecord {
  id: string;
  student_id: string;
  month: string;
  amount: number;
  status: string;
  paid_at?: string;
  profiles?: { name: string; roll_number: string; hostel: string } | null;
}

export default function MessOwnerPaymentHistory() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [queryError, setQueryError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setQueryError(null);

    // Step 1: fetch paid fees for the month (no join — avoids RLS recursion on profiles)
    const { data: feesData, error: feesError } = await supabase
      .from("mess_fees")
      .select("id, student_id, month, amount, status, paid_at")
      .eq("month", month)
      .eq("status", "paid")
      .order("paid_at", { ascending: false, nullsFirst: false });

    if (feesError) {
      setQueryError(feesError.message);
      setRecords([]);
      if (!silent) setLoading(false);
      else setRefreshing(false);
      return;
    }

    const fees = feesData || [];

    if (fees.length === 0) {
      setRecords([]);
      setLastUpdated(new Date());
      if (!silent) setLoading(false);
      else setRefreshing(false);
      return;
    }

    // Step 2: fetch profiles separately for the student IDs
    const studentIds = fees.map((f) => f.student_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, name, roll_number, hostel")
      .in("id", studentIds);

    const profileMap: Record<string, { name: string; roll_number: string; hostel: string }> = {};
    (profilesData || []).forEach((p) => { profileMap[p.id] = p; });

    // Step 3: merge — amount cast to Number so formatPKR works correctly
    const merged: PaymentRecord[] = fees.map((f) => ({
      ...f,
      amount: Number(f.amount),
      profiles: profileMap[f.student_id] || null,
    }));

    setRecords(merged);
    setLastUpdated(new Date());
    if (!silent) setLoading(false);
    else setRefreshing(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = setInterval(() => load(true), 30000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`payment_history_${month}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mess_fees" }, () => { load(true); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [month, load]);

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

  const formatLastUpdated = () => {
    if (!lastUpdated) return "";
    return lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment History</h1>
          <p className="text-sm text-muted-foreground">
            Paid mess fees • Auto-refreshes every 30s
            {lastUpdated && <span className="ml-1 text-xs text-muted-foreground/60">• Last: {formatLastUpdated()}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
          <Button variant="ghost" size="icon" onClick={() => load(true)} disabled={refreshing} title="Refresh now">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />CSV
          </Button>
        </div>
      </div>

      <NetworkWarningBanner />

      {queryError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Could not load payments: {queryError}</span>
        </div>
      )}

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
        <div className="text-center py-12 text-muted-foreground">No payments recorded for {month}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id} className="border border-border border-l-4 border-l-green-500">
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(r.profiles?.name || "?").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{r.profiles?.name || "Unknown Student"}</div>
                    <div className="text-xs text-muted-foreground">{r.profiles?.roll_number || "—"} • {r.profiles?.hostel || "—"}</div>
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
