import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { Search, Loader2 } from "lucide-react";

export default function TeacherStudents() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterHostel, setFilterHostel] = useState("all");

  useEffect(() => {
    supabase.from("profiles").select("*").eq("role", "student").eq("status", "active").order("name")
      .then(({ data }) => { setStudents(data || []); setLoading(false); });
  }, []);

  const filtered = students.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.roll_number || "").toLowerCase().includes(search.toLowerCase());
    const matchHostel = filterHostel === "all" || s.hostel === filterHostel;
    return matchSearch && matchHostel;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Students (Read-only)</h1>
        <p className="text-sm text-muted-foreground">{students.length} active students</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or roll no..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterHostel} onValueChange={setFilterHostel}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Hostel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Hostels</SelectItem>
            <SelectItem value="Jinnah">Jinnah</SelectItem>
            <SelectItem value="Iqbal">Iqbal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <Card key={s.id} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{s.name}</span>
                      <Badge className="text-xs bg-muted text-muted-foreground border-border">{s.hostel}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{s.roll_number} • Room {s.room_no} • Shift {s.shift} • {s.technology}</div>
                    <div className="text-xs text-muted-foreground">{s.phone}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
