import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Search, MessageCircle, ArrowLeft, ShieldAlert, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SUPER_ADMIN_EMAIL } from "@/lib/constants";

interface Profile { id: string; name: string; roll_number?: string; profile_photo_url?: string; email?: string; }
interface ConvRow { id: string; teacher_id: string; student_id: string; last_msg_at: string; teacher?: Profile; student?: Profile; msgCount?: number; }
interface Message { id: string; sender_id: string; content: string; sent_at: string; read_at: string | null; is_deleted: boolean; senderName?: string; }

function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); }
function fmtDate(iso: string) {
  const d = new Date(iso); const now = new Date();
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function isSameDay(a: string, b: string) { return new Date(a).toDateString() === new Date(b).toDateString(); }

// ── Restricted view for non-super admins ──────────────────────────────────
function RestrictedChatView({ conversations }: { conversations: ConvRow[] }) {
  const [search, setSearch] = useState("");
  const filtered = conversations.filter(c => {
    const q = search.toLowerCase();
    return (c.teacher?.name?.toLowerCase().includes(q) || c.student?.name?.toLowerCase().includes(q) || c.student?.roll_number?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4">
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="flex items-start gap-3 pt-4">
          <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-amber-800 dark:text-amber-400">Restricted Access</p>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
              You can view conversation statistics but message content is only accessible to the system administrator.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{conversations.length}</p>
              <p className="text-xs text-muted-foreground">Total Conversations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{new Set(conversations.map(c => c.teacher_id)).size}</p>
              <p className="text-xs text-muted-foreground">Active Teachers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{conversations.reduce((s, c) => s + (c.msgCount || 0), 0)}</p>
              <p className="text-xs text-muted-foreground">Total Messages</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search conversations…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground">
          <span>Teacher</span><span>Student</span><span>Last Active</span>
        </div>
        <div className="divide-y">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No conversations found</p>
          ) : filtered.map(conv => (
            <div key={conv.id} className="grid grid-cols-3 gap-2 px-4 py-3 text-sm hover:bg-muted/20 transition-colors">
              <span className="font-medium truncate">{conv.teacher?.name || "—"}</span>
              <span className="text-muted-foreground truncate">{conv.student?.name || "—"} <span className="text-xs">({conv.student?.roll_number})</span></span>
              <span className="text-xs text-muted-foreground">{fmtDate(conv.last_msg_at)} {fmtTime(conv.last_msg_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Full view for super admin ──────────────────────────────────────────────
function FullChatView({ conversations, profile }: { conversations: ConvRow[]; profile: any }) {
  const [selected, setSelected] = useState<ConvRow | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState("");
  const [showChat, setShowChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const scrollBottom = useCallback(() => { setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }, []);
  useEffect(() => { scrollBottom(); }, [messages]);

  async function openConv(conv: ConvRow) {
    setSelected(conv); setShowChat(true); setMessages([]); setLoadingMsgs(true);
    const { data: msgs } = await supabase.from("messages")
      .select("id, sender_id, content, sent_at, read_at, is_deleted")
      .eq("conversation_id", conv.id).eq("is_deleted", false).order("sent_at", { ascending: true });
    const allSenderIds = [...new Set((msgs || []).map((m: any) => m.sender_id))];
    let senderMap: Record<string, string> = {};
    if (allSenderIds.length > 0) {
      const { data: senders } = await supabase.from("profiles").select("id, name").in("id", allSenderIds);
      for (const s of senders || []) senderMap[s.id] = s.name;
    }
    setMessages((msgs || []).map((m: any) => ({ ...m, senderName: senderMap[m.sender_id] || "Unknown" })));
    setLoadingMsgs(false);
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase.channel("admin_chat_" + conv.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conv.id}` }, async (payload) => {
        const msg = payload.new as Message;
        if (!msg.is_deleted) {
          const { data: sender } = await supabase.from("profiles").select("name").eq("id", msg.sender_id).single();
          setMessages(prev => [...prev, { ...msg, senderName: sender?.name || "Unknown" }]);
        }
      }).subscribe();
  }

  const filtered = conversations.filter(c => {
    const q = search.toLowerCase();
    return (c.teacher?.name?.toLowerCase().includes(q) || c.student?.name?.toLowerCase().includes(q) || c.student?.roll_number?.toLowerCase().includes(q));
  });

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className={cn("w-full md:w-80 flex flex-col border-r bg-card", showChat && "hidden md:flex")}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base">All Conversations</h2>
            <Badge variant="outline" className="text-xs">{conversations.length}</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name…" className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No conversations yet</p>
          ) : filtered.map(conv => (
            <button key={conv.id} onClick={() => openConv(conv)}
              className={cn("w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors", selected?.id === conv.id && "bg-primary/10")}>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                {(conv.teacher?.name?.[0] || "T").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-xs truncate">{conv.teacher?.name || "Teacher"} ↔ {conv.student?.name || "Student"}</span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{fmtTime(conv.last_msg_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{conv.student?.roll_number}</span>
                  <span className="text-[10px] text-muted-foreground">{conv.msgCount} msgs</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={cn("flex-1 flex flex-col bg-background", !showChat && "hidden md:flex")}>
        {selected ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setShowChat(false)}><ArrowLeft className="h-4 w-4" /></Button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{selected.teacher?.name} ↔ {selected.student?.name}</p>
                <p className="text-xs text-muted-foreground">{selected.student?.roll_number} · System Admin View</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="h-10 w-10 mb-2 opacity-20" /><p className="text-sm">No messages yet</p>
                </div>
              ) : messages.map((msg, idx) => {
                const isTeacher = msg.sender_id === selected.teacher_id;
                const showDate = idx === 0 || !isSameDay(messages[idx - 1].sent_at, msg.sent_at);
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex items-center gap-2 my-4">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{fmtDate(msg.sent_at)}</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}
                    <div className={cn("flex mb-1", isTeacher ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm", isTeacher ? "bg-primary/20 text-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                        <p className="text-[10px] font-semibold mb-0.5 text-muted-foreground">{msg.senderName}</p>
                        <p className="break-words whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <span className="text-[10px] text-muted-foreground">{fmtTime(msg.sent_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageCircle className="h-14 w-14 opacity-15" />
            <p className="font-medium">Select a conversation to monitor</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main AdminChat component ───────────────────────────────────────────────
export default function AdminChat() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const isSuperAdmin = profile?.email === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: convs } = await supabase
        .from("conversations").select("id, teacher_id, student_id, last_msg_at")
        .order("last_msg_at", { ascending: false });
      if (!convs || convs.length === 0) { setConversations([]); setLoading(false); return; }
      const allIds = [...new Set([...convs.map((c: any) => c.teacher_id), ...convs.map((c: any) => c.student_id)])];
      const { data: profiles } = await supabase.from("profiles")
        .select("id, name, roll_number, profile_photo_url, email").in("id", allIds)
        .neq("email", SUPER_ADMIN_EMAIL);
      const pm: Record<string, Profile> = {};
      for (const p of profiles || []) pm[p.id] = p;
      const enriched: ConvRow[] = [];
      for (const c of convs) {
        const { count } = await supabase.from("messages").select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id).eq("is_deleted", false);
        enriched.push({ ...c, teacher: pm[c.teacher_id], student: pm[c.student_id], msgCount: count || 0 });
      }
      setConversations(enriched);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Chat Monitor</h1>
        <p className="text-sm text-muted-foreground">
          {isSuperAdmin ? "Full access — view all teacher-student conversations" : "Conversation statistics — message content is restricted"}
        </p>
      </div>
      {isSuperAdmin
        ? <FullChatView conversations={conversations} profile={profile} />
        : <RestrictedChatView conversations={conversations} />}
    </div>
  );
}
