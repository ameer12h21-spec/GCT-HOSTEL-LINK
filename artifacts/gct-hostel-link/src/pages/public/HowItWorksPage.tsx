import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const steps = [
  { step: "01", title: "Apply for Admission", desc: "Visit the Admissions page when admissions are open. Fill out the external application form with your details.", role: "Student" },
  { step: "02", title: "Create Your Account", desc: "Once admitted, sign up on GCT Hostel Link with your name, roll number, technology, room, shift, and hostel details.", role: "Student" },
  { step: "03", title: "Admin Approval", desc: "The administrator reviews your signup request and activates your account. Pending accounts cannot access the dashboard.", role: "Admin" },
  { step: "04", title: "Attendance Marking", desc: "Teachers mark daily attendance every night. Records are locked after 3 days. Only admins can edit locked records.", role: "Teacher" },
  { step: "05", title: "Fee Management", desc: "Mess owner sets global or per-student fees. Cash payments are recorded digitally in real-time with confirmation.", role: "Mess Owner" },
  { step: "06", title: "Electricity Bills", desc: "Teachers set monthly electricity bills per student. Bills are final once set — students can view but not contest.", role: "Teacher" },
  { step: "07", title: "Complaints", desc: "Students submit complaints with any category. Identity is anonymous to other students but visible to teachers and admin.", role: "Student" },
  { step: "08", title: "Audit & Trash", desc: "Nothing is permanently deleted by default. Admin can view all deleted records, audit trails, and restore or purge data.", role: "Admin" },
];

const roleColors: Record<string, string> = {
  Student: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  Teacher: "bg-green-500/15 text-green-600 border-green-500/30",
  "Mess Owner": "bg-orange-500/15 text-orange-600 border-orange-500/30",
  Admin: "bg-purple-500/15 text-purple-600 border-purple-500/30",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">How It Works</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            GCT Hostel Link digitizes the entire hostel management process — from admission to daily operations.
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((s, i) => (
            <Card key={s.step} className="border border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {s.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-foreground">{s.title}</h3>
                      <Badge className={`text-xs ${roleColors[s.role]}`}>{s.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { role: "Admin", desc: "Full system control, approvals, audit logs", color: "from-purple-500 to-purple-700" },
            { role: "Teacher", desc: "Attendance, electricity bills, complaint management", color: "from-green-500 to-green-700" },
            { role: "Mess Owner", desc: "Fee management, payment tracking", color: "from-orange-500 to-orange-700" },
            { role: "Student", desc: "View fees, attendance, submit complaints", color: "from-blue-500 to-blue-700" },
          ].map((r) => (
            <div key={r.role} className={`bg-gradient-to-br ${r.color} rounded-xl p-4 text-white text-center`}>
              <div className="font-bold text-sm mb-1">{r.role}</div>
              <div className="text-xs text-white/80 leading-snug">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
