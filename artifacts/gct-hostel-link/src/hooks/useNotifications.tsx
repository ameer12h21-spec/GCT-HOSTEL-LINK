import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

const ICON = "/site-logo.png";

async function askPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const p = await Notification.requestPermission();
  return p === "granted";
}

function fire(title: string, body: string, tag?: string) {
  if (Notification.permission !== "granted") return;
  try { new Notification(title, { body, icon: ICON, tag } as NotificationOptions); } catch {}
}

export function useNotifications() {
  const { profile } = useAuth();
  const channelsRef = useRef<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    askPermission();
    const channels: any[] = [];

    // ── TEACHER ──────────────────────────────────────────────────────────
    if (profile.role === "teacher") {
      const chatCh = supabase
        .channel("notif_teacher_chat_" + profile.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
          const msg = payload.new as any;
          if (msg.sender_id === profile.id) return;
          const { data: conv } = await supabase.from("conversations")
            .select("id, student_id").eq("id", msg.conversation_id).eq("teacher_id", profile.id).maybeSingle();
          if (!conv) return;
          const { data: student } = await supabase.from("profiles").select("name").eq("id", conv.student_id).single();
          fire("New Message", `${student?.name || "Student"}: ${msg.content.substring(0, 80)}`, "chat_" + msg.conversation_id);
        }).subscribe();
      channels.push(chatCh);

      const complaintCh = supabase
        .channel("notif_teacher_complaint_" + profile.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "complaints" }, () => {
          fire("New Complaint", "A student has submitted a new complaint.", "complaint_new");
        }).subscribe();
      channels.push(complaintCh);
    }

    // ── STUDENT ──────────────────────────────────────────────────────────
    if (profile.role === "student") {
      const chatCh = supabase
        .channel("notif_student_chat_" + profile.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
          const msg = payload.new as any;
          if (msg.sender_id === profile.id) return;
          const { data: conv } = await supabase.from("conversations")
            .select("id, teacher_id").eq("id", msg.conversation_id).eq("student_id", profile.id).maybeSingle();
          if (!conv) return;
          const { data: teacher } = await supabase.from("profiles").select("name").eq("id", conv.teacher_id).single();
          fire("New Message", `${teacher?.name || "Teacher"}: ${msg.content.substring(0, 80)}`, "chat_" + msg.conversation_id);
        }).subscribe();
      channels.push(chatCh);

      const feesCh = supabase
        .channel("notif_student_fees_" + profile.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "mess_fees",
          filter: `student_id=eq.${profile.id}` }, (payload) => {
          const fee = payload.new as any;
          fire("Mess Fee Set", `Your mess fee for ${fee.month} has been set.`, "mess_fee");
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "mess_fees",
          filter: `student_id=eq.${profile.id}` }, (payload) => {
          const fee = payload.new as any;
          const paid = fee.status === "paid";
          fire("Mess Fee Update", `Your mess fee for ${fee.month} has been ${paid ? "marked as PAID" : "updated"}.`, "mess_fee_upd");
        }).subscribe();
      channels.push(feesCh);

      const elecCh = supabase
        .channel("notif_student_elec_" + profile.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "electricity_bills",
          filter: `student_id=eq.${profile.id}` }, (payload) => {
          const bill = payload.new as any;
          fire("Electricity Bill", `Your electricity bill for ${bill.month} has been issued.`, "elec_bill");
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "electricity_bills",
          filter: `student_id=eq.${profile.id}` }, (payload) => {
          const bill = payload.new as any;
          const paid = bill.status === "paid";
          fire("Electricity Bill", `Your electricity bill for ${bill.month} has been ${paid ? "marked as PAID" : "updated"}.`, "elec_bill_upd");
        }).subscribe();
      channels.push(elecCh);

      const complaintCh = supabase
        .channel("notif_student_complaint_" + profile.id)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "complaints",
          filter: `student_id=eq.${profile.id}` }, (payload) => {
          const c = payload.new as any;
          if (c.reply) fire("Complaint Update", `Your complaint "${c.subject}" has received a response.`, "complaint_reply");
          else if (c.status === "fixed") fire("Complaint Resolved", `Your complaint "${c.subject}" has been marked as resolved.`, "complaint_fixed");
        }).subscribe();
      channels.push(complaintCh);
    }

    // ── ADMIN ─────────────────────────────────────────────────────────────
    if (profile.role === "admin") {
      const regCh = supabase
        .channel("notif_admin_reg_" + profile.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload) => {
          const p = payload.new as any;
          if (p.role === "student" && p.status === "pending") {
            fire("New Registration", `${p.name} has applied for hostel admission.`, "student_reg");
          }
        }).subscribe();
      channels.push(regCh);

      const complaintCh = supabase
        .channel("notif_admin_complaint_" + profile.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "complaints" }, () => {
          fire("New Complaint", "A student has filed a new complaint.", "admin_complaint");
        }).subscribe();
      channels.push(complaintCh);
    }

    // ── MESS OWNER ────────────────────────────────────────────────────────
    if (profile.role === "mess_owner") {
      const feesCh = supabase
        .channel("notif_mess_fees_" + profile.id)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "mess_fees" }, (payload) => {
          const fee = payload.new as any;
          if (fee.status === "paid") fire("Fee Paid", `A student's mess fee for ${fee.month} has been marked as paid.`, "fee_paid");
        }).subscribe();
      channels.push(feesCh);
    }

    channelsRef.current = channels;
    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [profile?.id, profile?.role]);
}
