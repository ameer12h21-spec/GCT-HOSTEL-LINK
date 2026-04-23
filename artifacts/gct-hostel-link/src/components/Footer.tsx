import { Link } from "wouter";
import { Building2, Mail, Phone, MapPin, Github, Shield, CheckCircle2 } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function Footer() {
  const { settings } = useSiteSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-sidebar text-sidebar-foreground border-t border-sidebar-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md"
                style={{ background: `linear-gradient(135deg, ${settings.ctaGradFrom}, ${settings.ctaGradTo})` }}>
                {settings.logoUrl
                  ? <img src={settings.logoUrl} alt="GCT Hostel Link Logo" className="w-full h-full object-contain" />
                  : <Building2 className="w-5 h-5 text-white" />}
              </div>
              <div>
                <div className="font-bold text-white text-sm leading-tight">{settings.siteName}</div>
                <div className="text-xs text-sidebar-foreground/60">{settings.siteSubtitle}</div>
              </div>
            </div>
            <p className="text-sidebar-foreground/65 text-sm leading-relaxed mb-5">
              {settings.footerTagline}
            </p>
            <div className="space-y-2.5 mb-5">
              <a href="https://www.google.com/maps/search/GCT+TEVTA+Taxila" target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm text-sidebar-foreground/60 hover:text-white transition-colors group">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 group-hover:text-orange-400 transition-colors" />
                <span>{settings.footerAddress}</span>
              </a>
              <a href={`tel:${settings.footerPhone}`}
                className="flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-white transition-colors group">
                <Phone className="w-4 h-4 flex-shrink-0 group-hover:text-green-400 transition-colors" />
                <span>{settings.footerPhone}</span>
              </a>
              <a href={`mailto:${settings.footerEmail}`}
                className="flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-white transition-colors group">
                <Mail className="w-4 h-4 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                <span>{settings.footerEmail}</span>
              </a>
            </div>
            {/* Trust badges */}
            <div className="flex flex-wrap gap-2">
              {["Secure", "Real-time", "PKR Billing", "Offline Ready"].map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1 text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-sidebar-foreground/60">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />{badge}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h3 className="font-semibold text-white text-xs uppercase tracking-widest mb-5">Platform</h3>
            <ul className="space-y-3">
              {[
                { href: "/about", label: "About Hostel" },
                { href: "/facilities", label: "Facilities" },
                { href: "/how-it-works", label: "How It Works" },
                { href: "/admissions", label: "Admissions" },
                { href: "/support", label: "Support" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-sidebar-foreground/60 hover:text-white transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-sidebar-foreground/30 group-hover:bg-primary transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Portal Links + Legal */}
          <div className="md:col-span-4">
            <h3 className="font-semibold text-white text-xs uppercase tracking-widest mb-5">Portals</h3>
            <ul className="space-y-3 mb-8">
              {[
                { href: "/login", label: "Student Login" },
                { href: "/login", label: "Teacher Login" },
                { href: "/login", label: "Admin Portal" },
                { href: "/signup", label: "New Registration" },
                { href: "/admissions", label: "Apply for Admission" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-sidebar-foreground/60 hover:text-white transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-sidebar-foreground/30 group-hover:bg-primary transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="font-semibold text-white text-xs uppercase tracking-widest mb-3">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-sidebar-foreground/60 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-sidebar-foreground/60 hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-sidebar-border mb-6" />

        {/* Security strip */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sidebar-foreground/40 text-xs mb-6">
          {[
            { icon: Shield, text: "Row-Level Security" },
            { icon: CheckCircle2, text: "Data Encrypted at Rest" },
            { icon: Shield, text: "Role-Based Access Control" },
            { icon: CheckCircle2, text: "Full Audit Trail" },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />{text}
            </span>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-sidebar-foreground/40">
          <p className="text-center sm:text-left">
            © {year} GCT Hostel Link · Designed for GCT TEVTA Taxila, Punjab, Pakistan
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/ameer12h21-spec/GCT-HOSTEL-LINK" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Github className="w-3.5 h-3.5" />Source
            </a>
            <span>|</span>
            <span>Built for Excellence</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
