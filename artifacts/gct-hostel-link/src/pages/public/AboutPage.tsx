import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, MapPin, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">About GCT TEVTA Hostel</h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Government College of Technology (GCT) TEVTA Taxila provides quality technical education 
            with residential facilities for students from across Pakistan.
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-8 mb-8 border border-blue-200/50 dark:border-blue-800/50">
            <h2 className="text-2xl font-bold text-foreground mb-4">Our Hostel Facility</h2>
            <p className="text-muted-foreground leading-relaxed">
              GCT TEVTA Hostel in Taxila provides a safe, disciplined, and comfortable living environment 
              for students pursuing technical education. The hostel is managed by dedicated staff to ensure 
              students can focus on their studies while receiving proper accommodation, meals, and support services.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {[
            { icon: Building2, title: "Two Hostels", desc: "Jinnah Hostel and Iqbal Hostel, providing accommodation for students of both morning and evening shifts.", color: "text-blue-500" },
            { icon: Users, title: "Multiple Roles", desc: "Managed by a dedicated team of administrators, teachers, and mess owners ensuring smooth daily operations.", color: "text-purple-500" },
            { icon: MapPin, title: "Location", desc: "Located in Taxila, Punjab — a historic city with excellent connectivity and infrastructure for students.", color: "text-orange-500" },
            { icon: Award, title: "TEVTA Standards", desc: "Operated under Technical Education and Vocational Training Authority (TEVTA) Punjab standards and guidelines.", color: "text-green-500" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border border-border">
                <CardContent className="p-6">
                  <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="bg-muted/50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">About GCT Hostel Link</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            GCT Hostel Link is a modern digital management system developed to replace paper-based 
            administrative processes. Built by Ameer Hamza Arshad, this system provides:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">• Real-time mess fee tracking with PKR currency support</li>
            <li className="flex items-start gap-2">• Digital attendance with automatic locking after 3 days</li>
            <li className="flex items-start gap-2">• Electricity bill management per student per month</li>
            <li className="flex items-start gap-2">• Anonymous complaint system with full audit trail</li>
            <li className="flex items-start gap-2">• Role-based access for Admin, Teacher, Mess Owner, and Student</li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
}
