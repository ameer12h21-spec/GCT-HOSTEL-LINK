import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck, UserCheck, ShieldCheck, Lock,
  DollarSign, Zap, MessageSquare, Trash2, ArrowRight,
} from "lucide-react";

const steps = [
  { step: "01", icon: UserCheck, title: "Apply for Admission", desc: "Visit the Admissions page when admissions are open. Fill out the online form with your personal details, technology, and hostel preference.", role: "Student", color: "from-blue-600 to-indigo-600" },
  { step: "02", icon: ShieldCheck, title: "Create Your Account", desc: "Once admitted, register on GCT Hostel Link with your roll number, room number, hostel (Jinnah or Iqbal), and shift details.", role: "Student", color: "from-blue-500 to-cyan-600" },
  { step: "03", icon: Lock, title: "Admin Approval", desc: "The administrator reviews your registration and activates your account. Pending accounts cannot access the dashboard or view any data.", role: "Admin", color: "from-purple-600 to-violet-700" },
  { step: "04", icon: CalendarCheck, title: "Daily Attendance", desc: "Teachers mark attendance every night. Records auto-lock after 3 days for data integrity. Only admin can edit locked records.", role: "Teacher", color: "from-green-600 to-emerald-700" },
  { step: "05", icon: DollarSign, title: "Mess Fee Management", desc: "Mess owner sets fees and records cash payments digitally in real-time. Each student sees their current payment status instantly.", role: "Mess Owner", color: "from-orange-600 to-red-600" },
  { step: "06", icon: Zap, title: "Electricity Billing", desc: "Teachers set monthly electricity bills per student. Bills are confirmed once set. Students view their bill without the ability to contest.", role: "Teacher", color: "from-yellow-600 to-orange-600" },
  { step: "07", icon: MessageSquare, title: "Complaint System", desc: "Students submit complaints under any category. Identity is anonymous to other students but fully visible to teachers and admin for resolution.", role: "Student", color: "from-pink-600 to-rose-600" },
  { step: "08", icon: Trash2, title: "Audit & Data Safety", desc: "Nothing is permanently deleted by default. Admin can view all deleted records, complete audit trails, and restore or permanently purge data.", role: "Admin", color: "from-slate-600 to-slate-800" },
];

const roleColors: Record<string, string> = {
  Student: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  Teacher: "bg-green-500/15 text-green-600 border-green-500/30",
  "Mess Owner": "bg-orange-500/15 text-orange-600 border-orange-500/30",
  Admin: "bg-purple-500/15 text-purple-600 border-purple-500/30",
};

const roles = [
  { role: "Admin", color: "from-purple-600 to-violet-700", desc: "Full system control, approvals, audit logs, staff management, site settings." },
  { role: "Teacher", color: "from-green-600 to-emerald-700", desc: "Attendance, electricity bills, complaint management, student overview." },
  { role: "Mess Owner", color: "from-orange-600 to-red-700", desc: "Fee management, payment recording, monthly collection analytics." },
  { role: "Student", color: "from-blue-600 to-indigo-700", desc: "View fees, attendance, submit complaints, chat with teacher." },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-16 pb-12 bg-gradient-to-br from-muted/60 to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20">Platform Guide</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">How It Works</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            GCT Hostel Link digitizes the entire hostel management lifecycle — from admission to daily operations — in a step-by-step, role-aware workflow.
          </p>
        </div>
      </section>

      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">

        {/* Steps */}
        <div className="relative">
          {/* Vertical connector line (desktop) */}
          <div className="absolute left-7 top-12 bottom-12 w-0.5 bg-gradient-to-b from-primary/30 via-border to-transparent hidden sm:block" />

          <div className="space-y-5">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative group">
                  <Card className="border border-border hover:border-primary/40 hover:shadow-md transition-all">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start gap-4 sm:gap-5">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-xs font-mono text-muted-foreground/60">{s.step}</span>
                            <h3 className="font-semibold text-foreground">{s.title}</h3>
                            <Badge className={`text-xs ${roleColors[s.role]}`}>{s.role}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Role Summary */}
        <div className="mt-14">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">The Four Roles</h2>
          <p className="text-muted-foreground text-sm text-center mb-8">Each role has a dedicated dashboard, showing exactly what they need — nothing more.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {roles.map((r) => (
              <div key={r.role} className={`bg-gradient-to-br ${r.color} rounded-2xl p-5 text-white text-center shadow-md`}>
                <div className="font-bold text-base mb-2">{r.role}</div>
                <div className="text-xs text-white/75 leading-snug">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 bg-gradient-to-br from-primary/5 via-primary/5 to-background border border-primary/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6">Create your account today and experience digital hostel management.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button className="gap-2 font-semibold">Create Account <ArrowRight className="w-4 h-4" /></Button>
            </Link>
            <Link href="/admissions">
              <Button variant="outline">View Admissions Info</Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
