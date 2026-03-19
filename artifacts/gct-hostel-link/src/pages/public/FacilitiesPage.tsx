import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Wifi, UtensilsCrossed, Zap, Shield, Bed, BookOpen, Droplets, Bus } from "lucide-react";

const facilities = [
  { icon: Bed, title: "Accommodation", desc: "Comfortable rooms in Jinnah Hostel and Iqbal Hostel. Multiple students per room with adequate space and ventilation.", color: "text-blue-500" },
  { icon: UtensilsCrossed, title: "Mess Services", desc: "Quality meals provided through the mess system. Monthly fees managed digitally with transparent payment tracking.", color: "text-orange-500" },
  { icon: Zap, title: "Electricity", desc: "24/7 electricity supply with per-student monthly billing managed through the digital system.", color: "text-yellow-500" },
  { icon: Shield, title: "Security", desc: "Round-the-clock security ensuring the safety of all residents with proper entry/exit management.", color: "text-green-500" },
  { icon: BookOpen, title: "Study Areas", desc: "Dedicated study spaces for students to focus on their technical education and assignments.", color: "text-purple-500" },
  { icon: Droplets, title: "Sanitation", desc: "Clean washroom and bathroom facilities maintained regularly for proper hygiene standards.", color: "text-cyan-500" },
  { icon: Wifi, title: "Internet Access", desc: "Internet connectivity to support students' academic research and communication needs.", color: "text-indigo-500" },
  { icon: Bus, title: "Transportation", desc: "Convenient location in Taxila with access to public transportation for easy commute to the college.", color: "text-red-500" },
];

export default function FacilitiesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Hostel Facilities</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            GCT TEVTA Hostel provides comprehensive facilities to ensure students have a comfortable and productive stay.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { value: "2", label: "Hostels" },
            { value: "2", label: "Shifts" },
            { value: "24/7", label: "Security" },
            { value: "PKR", label: "Transparent Billing" },
          ].map((s) => (
            <div key={s.label} className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl p-6 text-center border border-blue-200/50 dark:border-blue-800/50">
              <div className="text-3xl font-bold text-primary mb-1">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {facilities.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="border border-border hover:border-primary/30 transition-colors group">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 bg-muted/50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Two Hostel Buildings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <div className="bg-background rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-2">Jinnah Hostel</h3>
              <p className="text-sm text-muted-foreground">Named after the founder of Pakistan, Quaid-e-Azam Muhammad Ali Jinnah. Provides residential facilities for hostel students.</p>
            </div>
            <div className="bg-background rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-2">Iqbal Hostel</h3>
              <p className="text-sm text-muted-foreground">Named after the national poet of Pakistan, Allama Muhammad Iqbal. Provides residential facilities with modern amenities.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
