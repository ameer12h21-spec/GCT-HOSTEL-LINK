import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, CalendarCheck, DollarSign, Zap,
  MessageSquare, Shield, ChevronRight, Star, BookOpen
} from "lucide-react";

const features = [
  { icon: Users, title: "Student Management", desc: "Full student lifecycle from admission to graduation with profile management and approval workflows.", color: "text-blue-500" },
  { icon: CalendarCheck, title: "Daily Attendance", desc: "Teachers mark attendance once per day. Records lock after 3 days. Admin can override anytime.", color: "text-green-500" },
  { icon: DollarSign, title: "Mess Fee Tracking", desc: "Global and per-student fee management. Real-time paid/unpaid status. Cash payment tracking.", color: "text-orange-500" },
  { icon: Zap, title: "Electricity Bills", desc: "Monthly per-student electricity bills set by teachers. Full payment history and tracking.", color: "text-yellow-500" },
  { icon: MessageSquare, title: "Complaints System", desc: "Anonymous complaint submission. Teachers and admins manage resolutions with full audit trail.", color: "text-purple-500" },
  { icon: Shield, title: "Role-Based Access", desc: "Separate dashboards for Admin, Teacher, Mess Owner, and Student with strict permissions.", color: "text-red-500" },
];

const stats = [
  { value: "2", label: "Hostels", sub: "Jinnah & Iqbal" },
  { value: "2", label: "Shifts", sub: "Morning & Evening" },
  { value: "4", label: "Dashboards", sub: "Role-based access" },
  { value: "PKR", label: "Currency", sub: "Pakistani Rupee" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 py-20 sm:py-28">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bTEyIDEydjZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-500/30 px-4 py-1.5 text-sm">
            GCT TEVTA Hostel, Taxila
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Hostel Management
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Made Digital
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            GCT Hostel Link replaces paper registers with a secure, real-time digital system for managing 
            student admissions, attendance, mess fees, electricity bills, and complaints.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-none px-8 py-3 text-base font-semibold shadow-lg shadow-blue-500/25">
                Student Sign Up <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-base">
                Login to Dashboard
              </Button>
            </Link>
          </div>
          <div className="mt-6">
            <Link href="/admissions">
              <Button variant="ghost" className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 font-semibold">
                <BookOpen className="w-4 h-4 mr-2" />
                New Admissions — Apply Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{s.value}</div>
                <div className="text-sm font-semibold text-foreground">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete digital management system designed specifically for government hostel operations.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="border border-border hover:border-primary/40 transition-all hover:shadow-md group">
                  <CardContent className="p-6">
                    <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Students can sign up now. Admin, Teacher, and Mess Owner accounts are created by the administrator.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8">
                Student Sign Up
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 px-8">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
