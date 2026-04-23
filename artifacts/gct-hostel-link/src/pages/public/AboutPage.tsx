import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Building2, Users, MapPin, Award, Shield, BookOpen,
  Phone, Mail, CheckCircle2, ArrowRight,
} from "lucide-react";

const rules = [
  "It is compulsory for every boarder to take meals in the hostel. Special permission from the warden is required to eat outside permanently.",
  "Allotment of seats to students will be according to the convenience and management of the hostel committee.",
  "All students must be present in their rooms by 7:00 PM in winter and 9:00 PM in summer. Study hours: 9:00 PM – 11:00 PM (summer), 7:30 PM – 10:30 PM (winter).",
  "Students going on long leave must submit their luggage to the hostel warden and clear all dues.",
  "Students who frequently remain absent from classes can be expelled from the hostel.",
  "Remaining absent from the hostel at night without valid reason is a punishable offense. A fine of at least Rs. 500/- will be imposed.",
  "Immoral activities such as gambling, drinking, and narcotics are strictly prohibited. Guilty students will be immediately expelled.",
  "Residents must abide by all hostel rules and regulations; failure to do so will result in heavy fines or expulsion.",
  "Any student found guilty of misconduct or disobedience will face disciplinary action.",
  "The purpose of hostel residence is academic study. Creating disturbance or keeping weapons is strictly against the law.",
  "Hostel seat allotment is for a maximum of three years per DAE session. No short-course allotments.",
  "Mess fees must be paid by the 10th of each month. A fine of Rs. 10/- per day applies after the due date. One month default leads to expulsion.",
  "Every student must pay hostel security and mess advance upon admission.",
  "Every boarder is responsible for hostel property. Any damage must be compensated or expulsion will follow.",
  "Do not keep valuables or large sums of money in the hostel. The hostel is not responsible for any loss.",
  "All students must vacate the hostel during college vacations.",
  "Students must take morning exercise and participate in evening sports activities.",
  "The hostel warden has full authority to enforce rules and maintain discipline. In case of ambiguity, the principal's decision is final.",
];

const facilities = [
  { icon: "🍽️", title: "Mess & Dining", desc: "Quality food with hygienic kitchen" },
  { icon: "📚", title: "Study Room", desc: "Quiet space for focused learning" },
  { icon: "🎮", title: "Common Room", desc: "TV & indoor games for recreation" },
  { icon: "🔒", title: "24/7 Security", desc: "Round-the-clock security staff" },
  { icon: "💧", title: "Clean Water", desc: "RO purified drinking water" },
  { icon: "👕", title: "Laundry Area", desc: "Designated laundry facilities" },
  { icon: "⚡", title: "Electricity Backup", desc: "UPS and generator backup" },
  { icon: "🏥", title: "Medical Support", desc: "First aid and medical access" },
];

const management = [
  { role: "General Prefect", desc: "Overall discipline and student coordination" },
  { role: "Store Secretary", desc: "Inventory and supplies management" },
  { role: "Mess Committee", desc: "Food quality and menu planning" },
  { role: "Hostel Committee", desc: "General administration and facilities" },
  { role: "Mess Manager", desc: "Daily mess operations and staff management" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-16 pb-12 bg-gradient-to-br from-muted/60 to-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20">Our Story</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">About GCT TEVTA Hostel</h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
            A Place of Discipline, Comfort &amp; Learning — providing accommodation to students in a structured, secure, and academically focused environment.
          </p>
        </div>
      </section>

      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full space-y-14">

        {/* About overview */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-8 border border-blue-200/50 dark:border-blue-800/50">
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Hostel</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The TEVTA Hostel at Government College of Technology, Taxila, provides accommodation to students in a disciplined and secure environment. The hostel ensures academic focus, personal growth, and a community built on respect and responsibility — under the governance of TEVTA Punjab.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: "500+", label: "Students Capacity" },
              { value: "24/7", label: "Security Cover" },
              { value: "50+", label: "Hostel Rooms" },
              { value: "15+", label: "Staff Members" },
            ].map((s) => (
              <div key={s.label} className="text-center bg-white/60 dark:bg-white/5 rounded-xl p-4 border border-blue-100/50 dark:border-blue-900/30">
                <div className="text-2xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { icon: Building2, title: "Two Hostels", desc: "Jinnah Hostel and Iqbal Hostel, providing accommodation for students of both morning and evening shifts in a safe, monitored environment.", color: "text-blue-600", bg: "bg-blue-500/10" },
            { icon: Users, title: "Multiple Roles", desc: "Managed by administrators, teachers, mess committee, and a mess manager — ensuring smooth operations and student welfare at every level.", color: "text-purple-600", bg: "bg-purple-500/10" },
            { icon: MapPin, title: "Location", desc: "HMC Road near HMC-3, Government College of Technology (TEVTA), Taxila, Punjab, Pakistan — accessible by public transportation.", color: "text-orange-600", bg: "bg-orange-500/10" },
            { icon: Award, title: "TEVTA Standards", desc: "Operated under Technical Education and Vocational Training Authority (TEVTA) Punjab — ensuring quality, discipline, and technical excellence.", color: "text-green-600", bg: "bg-green-500/10" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border border-border hover:border-primary/30 hover:shadow-sm transition-all">
                <CardContent className="p-6">
                  <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Hostel Rules */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Hostel Rules &amp; Regulations</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6">To maintain discipline and ensure a conducive environment for academic learning and personal development.</p>
          <div className="space-y-3">
            {rules.map((rule, i) => (
              <div key={i} className="flex gap-3 bg-muted/40 rounded-xl p-4 border border-border hover:border-primary/20 transition-colors">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-foreground leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Facilities */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Facilities Provided</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6">Everything a student needs to focus on academics during their stay.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {facilities.map((f) => (
              <Card key={f.title} className="border border-border hover:border-primary/30 transition-colors text-center">
                <CardContent className="p-5">
                  <div className="text-3xl mb-2">{f.icon}</div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Management Structure */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Management Structure</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6">A team of dedicated committees supports the warden in day-to-day hostel operations.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {management.map((m) => (
              <Card key={m.role} className="border border-border hover:border-primary/20 transition-colors">
                <CardContent className="p-5">
                  <div className="w-2 h-2 rounded-full bg-primary mb-2" />
                  <h3 className="font-semibold text-foreground mb-1">{m.role}</h3>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic px-1">
            "These committees assist the hostel warden in smooth management and maintaining discipline under the supervision of the Principal."
          </p>
        </div>

        {/* Location & Contact */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Location &amp; Contact</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6">Reach us for any hostel-related inquiries or admissions information.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a href="https://www.google.com/maps/search/GCT+TEVTA+Taxila" target="_blank" rel="noopener noreferrer">
              <Card className="border border-border hover:border-orange-500/40 hover:shadow-sm transition-all h-full cursor-pointer">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-3">
                    <MapPin className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">Address</h3>
                  <p className="text-xs text-muted-foreground">HMC Road near HMC-3, Government College of Technology (TEVTA), Taxila, Punjab, Pakistan</p>
                </CardContent>
              </Card>
            </a>
            <a href="tel:+92511234567">
              <Card className="border border-border hover:border-green-500/40 hover:shadow-sm transition-all h-full cursor-pointer">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-3">
                    <Phone className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">Phone</h3>
                  <p className="text-xs text-muted-foreground">+92-51-1234567</p>
                </CardContent>
              </Card>
            </a>
            <a href="mailto:info@gcthostellink.edu.pk">
              <Card className="border border-border hover:border-blue-500/40 hover:shadow-sm transition-all h-full cursor-pointer">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">Email</h3>
                  <p className="text-xs text-muted-foreground">info@gcthostellink.edu.pk</p>
                </CardContent>
              </Card>
            </a>
          </div>
        </div>

        {/* About the Digital System */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">The GCT Hostel Link System</h2>
          <p className="text-muted-foreground leading-relaxed mb-5">
            GCT Hostel Link is a purpose-built digital management platform developed specifically for GCT TEVTA Hostel Taxila. It replaces paper-based administrative processes with a secure, real-time, role-based digital system — delivering transparency, speed, and accountability to every operation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Real-time mess fee tracking with PKR currency",
              "Digital attendance with automatic 3-day locking",
              "Per-student monthly electricity bill management",
              "Anonymous complaint system with full audit trail",
              "Role-based dashboards for all 4 user types",
              "Soft-delete trash system with restore & purge",
              "WhatsApp-style internal chat system",
              "CSV export for all records and reports",
            ].map((pt) => (
              <div key={pt} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{pt}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href="/how-it-works">
              <Button className="gap-2">How It Works <ArrowRight className="w-4 h-4" /></Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline">Create Account</Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
