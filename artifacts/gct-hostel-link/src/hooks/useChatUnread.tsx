import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export function useChatUnread(): number {
  const { profile } = useAuth();
  const [count, setCount] = useState(0);

  async function fetchCount() {
    if (!profile || !["teacher", "student"].includes(profile.role)) return;

    const field = profile.role === "teacher" ? "teacher_id" : "student_id";
    const { data: convs } = await supabase
      .from("conversations")
      .select("id")
      .eq(field, profile.id);

    if (!convs || convs.length === 0) { setCount(0); return; }

    const ids = convs.map((c: any) => c.id);
    const { count: unread } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", ids)
      .neq("sender_id", profile.id)
      .is("read_at", null)
      .eq("is_deleted", false);

    setCount(unread || 0);
  }

  useEffect(() => {
    if (!profile || !["teacher", "student"].includes(profile.role)) return;
    fetchCount();

    const channel = supabase
      .channel("unread_" + profile.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, fetchCount)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  return count;
}
