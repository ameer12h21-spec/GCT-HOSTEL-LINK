import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, MapPin, Award, Shield, BookOpen, Clock, Phone, Mail } from "lucide-react";

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
  { icon: "🍽️", title: "Mess & Dining", desc: "Quality food with hygienic kitchen facilities" },
  { icon: "📚", title: "Study Room", desc: "Quiet environment for focused study sessions" },
  { icon: "🎮", title: "Common Room", desc: "TV & indoor games for recreation" },
  { icon: "🔒", title: "24/7 Security", desc: "Round-the-clock security staff" },
  { icon: "💧", title: "Clean Water", desc: "RO purified drinking water" },
  { icon: "👕", title: "Laundry Area", desc: "Designated laundry space available" },
  { icon: "⚡", title: "Electricity Backup", desc: "UPS and generator backup" },
  { icon: "🏥", title: "Medical Support", desc: "First aid and medical facilities" },
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
      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">About GCT TEVTA Hostel</h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            A Place of Discipline, Comfort & Learning — providing accommodation to students in a disciplined and secure environment.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-8 mb-10 border border-blue-200/50 dark:border-blue-800/50">
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Hostel</h2>
          <p className="text-muted-foreground leading-relaxed">
            The TEVTA Hostel at Government College of Technology, Taxila, provides accommodation to students in a disciplined and secure environment. The hostel ensures academic focus, personal growth, and a community built on respect and responsibility.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { value: "500+", label: "Students Capacity" },
              { value: "24/7", label: "Security" },
              { value: "50+", label: "Rooms" },
              { value: "15+", label: "Staff Members" },
            ].map((s) => (
              <div key={s.label} className="text-center bg-white/60 dark:bg-white/5 rounded-xl p-3">
                <div className="text-2xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {[
            { icon: Building2, title: "Two Hostels", desc: "Jinnah Hostel and Iqbal Hostel, providing accommodation for students of both morning and evening shifts.", color: "text-blue-500" },
            { icon: Users, title: "Multiple Roles", desc: "Managed by a dedicated team of administrators, teachers, mess committee, and mess manager ensuring smooth daily operations.", color: "text-purple-500" },
            { icon: MapPin, title: "Location", desc: "HMC Road near HMC-3, Government College of Technology (TEVTA), Taxila, Punjab, Pakistan.", color: "text-orange-500" },
            { icon: Award, title: "TEVTA Standards", desc: "Operated under Technical Education and Vocational Training Authority (TEVTA) Punjab standards for quality technical education.", color: "text-green-500" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border border-border">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4">
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Hostel Rules & Regulations
          </h2>
          <p className="text-muted-foreground text-sm mb-6">To maintain discipline and ensure a conducive environment for learning.</p>
          <div className="space-y-3">
            {rules.map((rule, i) => (
              <div key={i} className="flex gap-3 bg-muted/40 rounded-xl p-4 border border-border">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-foreground leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Hostel Facilities
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {facilities.map((f) => (
              <Card key={f.title} className="border border-border text-center">
                <CardContent className="p-5">
                  <div className="text-3xl mb-2">{f.icon}</div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 bg-muted/40 rounded-xl p-4 border border-border text-sm text-muted-foreground">
            <strong className="text-foreground">Common Room Timings:</strong><br />
            TV Hall: 4:00 PM – 9:00 PM (Summer), 4:00 PM – 7:30 PM (Winter)<br />
            Common Room: 9:00 AM – 9:00 PM (Sundays & Holidays)<br />
            <span className="text-xs mt-1 block">Note: Items from the common room (newspapers, magazines, carom board, etc.) are not allowed in rooms.</span>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Hostel Management Structure
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {management.map((m) => (
              <Card key={m.role} className="border border-border">
                <CardContent className="p-5">
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

        <div className="mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Location & Contact
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-border">
              <CardContent className="p-5">
                <MapPin className="w-6 h-6 text-orange-500 mb-2" />
                <h3 className="font-semibold text-sm text-foreground mb-1">Address</h3>
                <p className="text-xs text-muted-foreground">HMC Road near HMC-3, Government College of Technology (TEVTA), Taxila, Punjab, Pakistan</p>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="p-5">
                <Phone className="w-6 h-6 text-green-500 mb-2" />
                <h3 className="font-semibold text-sm text-foreground mb-1">Phone</h3>
                <p className="text-xs text-muted-foreground">+92-51-1234567</p>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="p-5">
                <Mail className="w-6 h-6 text-blue-500 mb-2" />
                <h3 className="font-semibold text-sm text-foreground mb-1">Email</h3>
                <p className="text-xs text-muted-foreground">info@gcthostellink.edu.pk</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="bg-muted/50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">About GCT Hostel Link System</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            GCT Hostel Link is a modern digital management system developed to replace paper-based administrative processes at GCT TEVTA Hostel, Taxila. Built by <strong className="text-foreground">Ameer Hamza Arshad</strong>, this system provides:
          </p>
          <ul className="space-y-2 text-muted-foreground text-sm">
            <li className="flex items-start gap-2">• Real-time mess fee tracking with PKR currency support</li>
            <li className="flex items-start gap-2">• Digital attendance management with automatic 3-day locking</li>
            <li className="flex items-start gap-2">• Per-student monthly electricity bill management</li>
            <li className="flex items-start gap-2">• Anonymous complaint submission system with full audit trail</li>
            <li className="flex items-start gap-2">• Role-based dashboards for Admin, Teacher, Mess Owner, and Student</li>
            <li className="flex items-start gap-2">• Soft-delete trash system with restore and purge capabilities</li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
}
