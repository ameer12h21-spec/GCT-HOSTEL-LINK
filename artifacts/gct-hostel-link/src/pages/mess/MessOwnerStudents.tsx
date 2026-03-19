import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { Search, Loader2 } from "lucide-react";

export default function MessOwnerStudents() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("*").eq("role", "student").eq("status", "active").order("name")
      .then(({ data }) => { setStudents(data || []); setLoading(false); });
  }, []);

  const filtered = students.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.roll_number || "").toLowerCase().includes(search.toLowerCase()) || (s.hostel || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Students</h1>
        <p className="text-sm text-muted-foreground">{students.length} active students</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, roll no, hostel..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card key={s.id} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 overflow-hidden">
                    {s.profile_photo_url ? <img src={s.profile_photo_url} alt="Profile" className="w-full h-full object-cover" /> : s.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground text-sm truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.roll_number}</div>
                    <Badge className="text-xs bg-muted text-muted-foreground border-border mt-0.5">{s.hostel} Hostel</Badge>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>Room {s.room_no} • Shift {s.shift}</div>
                  <div>{s.technology}</div>
                  <div>{s.phone}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
