import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Wifi, UtensilsCrossed, Zap, Shield, Bed,
  BookOpen, Droplets, Bus, Clock, ArrowRight,
  CheckCircle2, Building2,
} from "lucide-react";

const facilities = [
  { icon: Bed, title: "Comfortable Rooms", desc: "Spacious rooms in Jinnah and Iqbal Hostel with adequate ventilation, proper furniture, and a safe environment for study.", color: "text-blue-600", bg: "bg-blue-500/10", gradient: "from-blue-500 to-indigo-600" },
  { icon: UtensilsCrossed, title: "Mess & Dining", desc: "Quality meals provided daily through the mess system. Monthly fees are managed digitally with transparent, real-time payment tracking.", color: "text-orange-600", bg: "bg-orange-500/10", gradient: "from-orange-500 to-red-600" },
  { icon: Zap, title: "Electricity Supply", desc: "24/7 electricity with UPS and generator backup. Per-student monthly billing is managed through the digital system — fair and transparent.", color: "text-yellow-600", bg: "bg-yellow-500/10", gradient: "from-yellow-500 to-orange-600" },
  { icon: Shield, title: "24/7 Security", desc: "Round-the-clock security personnel ensuring safety of all residents with proper entry/exit management and disciplinary oversight.", color: "text-green-600", bg: "bg-green-500/10", gradient: "from-green-500 to-emerald-600" },
  { icon: BookOpen, title: "Study Areas", desc: "Dedicated quiet study rooms for focused learning. Study hours are enforced during evenings to maintain academic standards.", color: "text-purple-600", bg: "bg-purple-500/10", gradient: "from-purple-500 to-violet-600" },
  { icon: Droplets, title: "Clean Water & Sanitation", desc: "RO purified drinking water and clean washroom/bathroom facilities maintained to high hygiene standards for all residents.", color: "text-cyan-600", bg: "bg-cyan-500/10", gradient: "from-cyan-500 to-blue-600" },
  { icon: Wifi, title: "Internet Access", desc: "Internet connectivity to support academic research, digital learning, and communication needs for all hostel residents.", color: "text-indigo-600", bg: "bg-indigo-500/10", gradient: "from-indigo-500 to-blue-600" },
  { icon: Bus, title: "Convenient Location", desc: "Located on HMC Road, Taxila — close to GCT campus with easy access to public transportation throughout the city.", color: "text-red-600", bg: "bg-red-500/10", gradient: "from-red-500 to-rose-600" },
];

const timing = [
  { label: "TV Hall (Summer)", value: "4:00 PM – 9:00 PM" },
  { label: "TV Hall (Winter)", value: "4:00 PM – 7:30 PM" },
  { label: "Common Room", value: "9:00 AM – 9:00 PM (Sundays & Holidays)" },
  { label: "Study Hours (Summer)", value: "9:00 PM – 11:00 PM" },
  { label: "Study Hours (Winter)", value: "7:30 PM – 10:30 PM" },
  { label: "Night Curfew (Summer)", value: "By 9:00 PM in rooms" },
  { label: "Night Curfew (Winter)", value: "By 7:00 PM in rooms" },
];

export default function FacilitiesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-16 pb-12 bg-gradient-to-br from-muted/60 to-background border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20">What We Offer</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Hostel Facilities</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            GCT TEVTA Hostel provides comprehensive residential facilities designed for students pursuing technical education at GCT Taxila.
          </p>
        </div>
      </section>

      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
          {[
            { value: "2", label: "Hostel Buildings", sub: "Jinnah & Iqbal" },
            { value: "2", label: "Shifts Covered", sub: "Morning & Evening" },
            { value: "24/7", label: "Security", sub: "Round the clock" },
            { value: "PKR", label: "Transparent Billing", sub: "Digital records" },
          ].map((s) => (
            <div key={s.label} className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 text-center">
              <div className="text-3xl font-bold text-primary mb-1">{s.value}</div>
              <div className="text-sm font-semibold text-foreground">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Facilities Grid */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold text-foreground mb-2">All Facilities</h2>
          <p className="text-muted-foreground text-sm mb-8">Eight key amenities ensuring a comfortable and productive stay.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {facilities.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="border border-border hover:border-primary/30 hover:shadow-md transition-all group cursor-default overflow-hidden">
                  <CardContent className="p-5">
                    <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-2">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Two Hostels */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />Two Hostel Buildings
          </h2>
          <p className="text-muted-foreground text-sm mb-6">Each hostel is named after a great leader of Pakistan, reflecting the values of discipline and purpose.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-gradient-to-br from-blue-500/5 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Jinnah Hostel</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Named after the founder of Pakistan, Quaid-e-Azam Muhammad Ali Jinnah. Provides residential facilities for hostel students with modern amenities.</p>
              <div className="mt-4 space-y-1.5">
                {["Dedicated warden management", "Common room access", "Study hours enforced"].map((pt) => (
                  <div key={pt} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{pt}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/5 to-violet-500/10 border border-purple-500/20 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Iqbal Hostel</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Named after the national poet of Pakistan, Allama Muhammad Iqbal. Provides residential facilities inspiring academic excellence and character building.</p>
              <div className="mt-4 space-y-1.5">
                {["Separate shift accommodation", "Security personnel present", "Clean and hygienic environment"].map((pt) => (
                  <div key={pt} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{pt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timings */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />Operating Hours
          </h2>
          <p className="text-muted-foreground text-sm mb-6">All hostel facilities operate on a structured schedule to maintain discipline and academic focus.</p>
          <div className="bg-muted/40 border border-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-border">
              {timing.map((t) => (
                <div key={t.label} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors">
                  <span className="text-sm text-muted-foreground">{t.label}</span>
                  <span className="text-sm font-semibold text-foreground">{t.value}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 px-1">Note: Common room items (newspapers, magazines, carom board) may not be taken to rooms. Timings may vary on special occasions.</p>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Want to Live Here?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Apply for admission and become part of GCT TEVTA Hostel — a place of discipline, comfort and learning.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/admissions">
              <Button className="gap-2 font-semibold">Apply for Admission <ArrowRight className="w-4 h-4" /></Button>
            </Link>
            <Link href="/about">
              <Button variant="outline">Learn About the Hostel</Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
