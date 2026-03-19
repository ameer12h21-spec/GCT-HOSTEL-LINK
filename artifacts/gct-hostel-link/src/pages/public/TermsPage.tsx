import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <h1 className="text-4xl font-bold text-foreground mb-2">Terms & Conditions</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2026</p>
        <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By creating an account on GCT Hostel Link, you agree to these Terms & Conditions. This platform is for authorized GCT TEVTA Hostel residents, staff, and administrators only.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Account Eligibility</h2>
            <p>Student accounts require a valid GCT TEVTA college roll number and must be approved by an administrator. Providing false information during signup may result in account termination.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Account Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your password. You must not share your account credentials with others. Report any unauthorized access immediately to the hostel administration.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Acceptable Use</h2>
            <p>This platform is for legitimate hostel management purposes only. Misuse includes: submitting false complaints, attempting unauthorized access to other accounts, providing false payment information, or any action that disrupts system integrity.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Fee Payments</h2>
            <p>Mess fees and electricity bills must be paid as directed by hostel management. Digital records updated by staff are considered official records. Disputes must be raised directly with the relevant staff member.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Complaints Policy</h2>
            <p>Complaints must be genuine and related to hostel matters. Abusive or false complaints may result in account disciplinary action. Complaint identities are visible to hostel staff.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Account Termination</h2>
            <p>Administrators may disable or delete accounts for rule violations. Deleted accounts' data is retained in the system's trash for audit purposes.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Limitation of Liability</h2>
            <p>GCT Hostel Link is provided as-is for operational management. The system is not liable for data discrepancies arising from offline processes or human error in data entry.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
