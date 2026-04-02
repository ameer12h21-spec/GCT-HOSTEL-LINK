import { Link } from "wouter";
import { Building2, Mail, Phone, MapPin } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function Footer() {
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-sidebar text-sidebar-foreground border-t border-sidebar-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${settings.ctaGradFrom}, ${settings.ctaGradTo})` }}
              >
                {settings.logoUrl
                  ? <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  : <Building2 className="w-5 h-5 text-white" />}
              </div>
              <div>
                <div className="font-bold text-white text-sm">{settings.siteName}</div>
                <div className="text-xs text-sidebar-foreground/70">{settings.siteSubtitle}</div>
              </div>
            </div>
            <p className="text-sidebar-foreground/70 text-sm leading-relaxed">
              {settings.footerTagline}
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{settings.footerAddress}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{settings.footerPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>{settings.footerEmail}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { href: "/about", label: "About Hostel" },
                { href: "/facilities", label: "Facilities" },
                { href: "/how-it-works", label: "How It Works" },
                { href: "/admissions", label: "Admissions" },
                { href: "/support", label: "Support" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-sidebar-foreground/70 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-sidebar-foreground/70 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-sidebar-foreground/70 hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-sidebar-border mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-sidebar-foreground/50 text-center sm:text-left">
            © 2026 Ameer Hamza Arshad — All Rights Reserved
          </p>
          <p className="text-sm text-sidebar-foreground/50">
            Developed by{" "}
            <a href="https://growweb-pk.web.app" target="_blank" rel="noopener noreferrer"
              className="text-sidebar-foreground/70 font-medium hover:text-white transition-colors">
              GROWWEB
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
