import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Search, MessageCircle, ArrowLeft, CheckCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentProfile { id: string; name: string; roll_number: string; profile_photo_url?: string; }
interface Conversation { id: string; student_id: string; last_msg_at: string; unread: number; lastMsg?: string; lastSenderMe?: boolean; }
interface Message { id: string; conversation_id: string; sender_id: string; content: string; sent_at: string; read_at: string | null; is_deleted: boolean; }

function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); }
function fmtDate(iso: string) {
  const d = new Date(iso); const now = new Date();
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function isSameDay(a: string, b: string) { return new Date(a).toDateString() === new Date(b).toDateString(); }

export default function TeacherChat() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [selected, setSelected] = useState<StudentProfile | null>(null);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState("");
  const [showChat, setShowChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const scrollBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  async function loadStudents() {
    if (!profile) return;
    setLoadingStudents(true);
    const { data: studentData } = await supabase
      .from("profiles").select("id, name, roll_number, profile_photo_url")
      .eq("role", "student").eq("status", "active").order("name");

    const { data: convData } = await supabase
      .from("conversations").select("id, student_id, last_msg_at")
      .eq("teacher_id", profile.id).order("last_msg_at", { ascending: false });

    const convMap = new Map<string, Conversation>();
    for (const c of convData || []) {
      const { count: unread } = await supabase.from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", c.id).neq("sender_id", profile.id)
        .is("read_at", null).eq("is_deleted", false);
      const { data: lastMsgs } = await supabase.from("messages")
        .select("content, sender_id").eq("conversation_id", c.id)
        .eq("is_deleted", false).order("sent_at", { ascending: false }).limit(1);
      const lm = lastMsgs?.[0];
      convMap.set(c.student_id, {
        id: c.id, student_id: c.student_id, last_msg_at: c.last_msg_at,
        unread: unread || 0, lastMsg: lm?.content,
        lastSenderMe: lm?.sender_id === profile.id,
      });
    }
    setStudents(studentData || []);
    setConversations(convMap);
    setLoadingStudents(false);
  }

  useEffect(() => { loadStudents(); }, [profile?.id]);
  useEffect(() => { scrollBottom(); }, [messages]);

  async function openChat(student: StudentProfile) {
    if (!profile) return;
    setSelected(student);
    setShowChat(true);
    setMessages([]);
    setLoadingMsgs(true);

    const { data: conv, error } = await supabase.from("conversations")
      .upsert({ teacher_id: profile.id, student_id: student.id }, { onConflict: "teacher_id,student_id" })
      .select("id, student_id, last_msg_at").single();

    let convId = conv?.id;
    if (error || !convId) {
      const { data: existing } = await supabase.from("conversations")
        .select("id").eq("teacher_id", profile.id).eq("student_id", student.id).single();
      convId = existing?.id;
    }
    if (!convId) { setLoadingMsgs(false); return; }

    setActiveConvId(convId);
    setConversations(prev => {
      const next = new Map(prev);
      const existing = next.get(student.id);
      next.set(student.id, { id: convId!, student_id: student.id, last_msg_at: existing?.last_msg_at || new Date().toISOString(), unread: 0, lastMsg: existing?.lastMsg, lastSenderMe: existing?.lastSenderMe });
      return next;
    });

    const { data: msgs } = await supabase.from("messages")
      .select("id, conversation_id, sender_id, content, sent_at, read_at, is_deleted")
      .eq("conversation_id", convId).eq("is_deleted", false)
      .order("sent_at", { ascending: true });
    setMessages(msgs || []);
    setLoadingMsgs(false);

    await supabase.from("messages").update({ read_at: new Date().toISOString() })
      .eq("conversation_id", convId).neq("sender_id", profile.id).is("read_at", null);

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase.channel("teacher_chat_" + convId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` }, (payload) => {
        const msg = payload.new as Message;
        if (!msg.is_deleted) {
          setMessages(prev => [...prev, msg]);
          if (msg.sender_id !== profile.id) {
            supabase.from("messages").update({ read_at: new Date().toISOString() })
              .eq("id", msg.id).then(() => {});
          }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` }, (payload) => {
        setMessages(prev => prev.map(m => m.id === (payload.new as Message).id ? payload.new as Message : m));
      })
      .subscribe();
  }

  async function sendMessage() {
    if (!newMsg.trim() || !activeConvId || !profile) return;
    const content = newMsg.trim(); setNewMsg(""); setSending(true);
    const { error } = await supabase.from("messages").insert({ conversation_id: activeConvId, sender_id: profile.id, content });
    if (error) { toast({ title: "Send failed", description: error.message, variant: "destructive" }); setNewMsg(content); }
    else { await supabase.from("conversations").update({ last_msg_at: new Date().toISOString() }).eq("id", activeConvId); }
    setSending(false);
  }

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q);
  }).sort((a, b) => {
    const ca = conversations.get(a.id); const cb = conversations.get(b.id);
    if (ca && cb) return new Date(cb.last_msg_at).getTime() - new Date(ca.last_msg_at).getTime();
    if (ca) return -1; if (cb) return 1; return a.name.localeCompare(b.name);
  });

  const totalUnread = Array.from(conversations.values()).reduce((s, c) => s + c.unread, 0);

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden rounded-xl border bg-background shadow-sm">
      {/* ── Left: Student List ── */}
      <div className={cn("w-full md:w-80 flex flex-col border-r bg-card", showChat && "hidden md:flex")}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base">Chats</h2>
            {totalUnread > 0 && <Badge variant="destructive" className="rounded-full text-xs h-5 min-w-5">{totalUnread}</Badge>}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search students…" className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {loadingStudents ? (
            <div className="flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No students found</p>
          ) : filtered.map(student => {
            const conv = conversations.get(student.id);
            const isActive = selected?.id === student.id;
            return (
              <button key={student.id} onClick={() => openChat(student)}
                className={cn("w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors", isActive && "bg-primary/10")}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {student.profile_photo_url
                    ? <img src={student.profile_photo_url} className="w-full h-full object-cover" alt="" />
                    : <span className="text-sm font-bold text-primary">{student.name[0].toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-sm truncate">{student.name}</span>
                    {conv && <span className="text-[10px] text-muted-foreground flex-shrink-0">{fmtTime(conv.last_msg_at)}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs text-muted-foreground truncate">
                      {conv?.lastMsg ? (conv.lastSenderMe ? "You: " : "") + conv.lastMsg : student.roll_number}
                    </span>
                    {(conv?.unread ?? 0) > 0 && <Badge className="h-5 min-w-5 text-[10px] rounded-full px-1 flex-shrink-0">{conv!.unread}</Badge>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: Chat Window ── */}
      <div className={cn("flex-1 flex flex-col bg-background", !showChat && "hidden md:flex")}>
        {selected && activeConvId ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setShowChat(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {selected.profile_photo_url
                  ? <img src={selected.profile_photo_url} className="w-full h-full object-cover" alt="" />
                  : <span className="text-sm font-bold text-primary">{selected.name[0].toUpperCase()}</span>}
              </div>
              <div>
                <p className="font-semibold text-sm">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.roll_number} · Student</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : messages.map((msg, idx) => {
                const isMe = msg.sender_id === profile?.id;
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
                    <div className={cn("flex mb-1", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm",
                        isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                        <p className="break-words whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <div className={cn("flex items-center gap-1 mt-0.5", isMe ? "justify-end" : "justify-start")}>
                          <span className={cn("text-[10px]", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>{fmtTime(msg.sent_at)}</span>
                          {isMe && (msg.read_at
                            ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                            : <Check className="h-3 w-3 text-primary-foreground/50" />)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t bg-card flex gap-2 items-center">
              <Input
                placeholder="Type a message…" value={newMsg} maxLength={2000}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                className="flex-1 h-10"
              />
              <Button size="icon" className="h-10 w-10 flex-shrink-0" onClick={sendMessage} disabled={!newMsg.trim() || sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageCircle className="h-14 w-14 opacity-15" />
            <p className="font-medium">Select a student to chat</p>
            <p className="text-sm opacity-70">Your secure conversations appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
