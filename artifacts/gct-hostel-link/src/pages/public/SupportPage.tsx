import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, MessageSquare, Clock, HelpCircle } from "lucide-react";

const faqs = [
  { q: "How do I sign up?", a: "Click the 'Sign Up' button and fill in your student information including name, roll number, technology, room number, shift, and hostel. Your account will be pending admin approval." },
  { q: "Why is my account still pending?", a: "Account activation requires admin approval to prevent unauthorized access. Please contact the hostel administration if your account has been pending for more than 2 business days." },
  { q: "Can I change my password?", a: "Yes! After login, go to your Profile page (or Settings for Mess Owner/Teacher) and you can change your password from there." },
  { q: "Who can see my complaints?", a: "Your identity in complaints is anonymous to other students. Only teachers and administrators can see who submitted a complaint." },
  { q: "Can I dispute my electricity bill?", a: "Electricity bills are set by teachers and are final. If you believe there's an error, please raise a complaint or contact the teacher/admin directly." },
  { q: "How does mess fee payment work?", a: "Mess fees are paid in cash to the mess owner or teacher. They then record the payment in the system in real-time. You can see your payment status in your Mess Fees dashboard." },
  { q: "What if attendance is marked incorrectly?", a: "Attendance records lock after 3 days. For corrections within 3 days, contact your teacher. For locked records, contact the administrator." },
  { q: "How do I apply for admissions?", a: "Visit the Admissions page to check if admissions are open. Click 'Apply Now' to access the application form (external link set by admin)." },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Support & Help</h1>
          <p className="text-muted-foreground text-lg">Get help with GCT Hostel Link or contact the hostel administration.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border border-border text-center">
            <CardContent className="p-6">
              <Mail className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Email Support</h3>
              <p className="text-sm text-muted-foreground">support@gcthostellink.edu.pk</p>
            </CardContent>
          </Card>
          <Card className="border border-border text-center">
            <CardContent className="p-6">
              <MapPin className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Location</h3>
              <p className="text-sm text-muted-foreground">GCT TEVTA Hostel, Taxila, Punjab</p>
            </CardContent>
          </Card>
          <Card className="border border-border text-center">
            <CardContent className="p-6">
              <Clock className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Office Hours</h3>
              <p className="text-sm text-muted-foreground">Mon – Fri, 8:00 AM – 4:00 PM</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <Card key={i} className="border border-border">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
