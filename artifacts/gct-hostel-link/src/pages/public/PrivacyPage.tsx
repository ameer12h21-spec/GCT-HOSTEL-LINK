import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2026</p>
        <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p>GCT Hostel Link collects information necessary to manage hostel operations, including: student name, father's name, college roll number, technology/trade, room number, shift, hostel assignment, email address, phone numbers, and home address. Profile photos are optional.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>Your information is used to: manage hostel admissions and student records, track attendance and fee payments, manage electricity bills, handle complaints and maintenance requests, and generate audit logs for administrative purposes.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Data Storage & Security</h2>
            <p>All data is stored securely using Supabase (PostgreSQL) with Row-Level Security (RLS) policies. Passwords are encrypted using industry-standard bcrypt hashing. Profile photos are stored in a secure Supabase Storage bucket.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Data Access</h2>
            <p>Access to data is strictly role-based. Students can only view their own records. Teachers can view student data for hostel management purposes. Administrators have full system access for operational management. Mess owners can access fee-related data only.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Complaints Anonymity</h2>
            <p>Complaints submitted by students are displayed anonymously to other students. However, the complaint author's identity is visible to teachers and administrators for proper complaint management.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
            <p>Records are not permanently deleted by default. Deleted records are moved to an administrative trash system. Administrators can restore or permanently purge records. Audit logs are maintained permanently.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
            <p>For privacy concerns, contact the hostel administration at support@gcthostellink.edu.pk.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
