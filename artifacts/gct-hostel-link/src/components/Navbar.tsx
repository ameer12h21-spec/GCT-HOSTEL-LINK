import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { signOut } from "@/lib/auth";
import { Moon, Sun, Menu, X, Building2 } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/facilities", label: "Facilities" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/admissions", label: "Admissions" },
  { href: "/support", label: "Support" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSiteSettings();
  const [location] = useLocation();

  async function handleSignOut() {
    await signOut();
    window.location.href = "/";
  }

  function getDashboardLink() {
    if (!profile) return null;
    switch (profile.role) {
      case "admin": return "/admin";
      case "teacher": return "/teacher";
      case "mess_owner": return "/mess";
      case "student": return "/student";
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md overflow-hidden flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${settings.ctaGradFrom}, ${settings.ctaGradTo})` }}
            >
              {settings.logoUrl
                ? <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                : <Building2 className="w-5 h-5 text-white" />}
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-foreground text-sm leading-tight">{settings.siteName}</div>
              <div className="text-xs text-muted-foreground">{settings.siteSubtitle}</div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {profile ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href={getDashboardLink()!}>
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign Out</Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="text-white border-none"
                    style={{ background: `linear-gradient(to right, ${settings.ctaGradFrom}, ${settings.ctaGradTo})` }}
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            <Button variant="ghost" size="icon" className="md:hidden rounded-lg" onClick={() => setOpen(!open)}>
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 space-y-1 border-t border-border mt-2 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {profile ? (
              <div className="pt-2 flex gap-2">
                <Link href={getDashboardLink()!} onClick={() => setOpen(false)} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Dashboard</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex-1">Sign Out</Button>
              </div>
            ) : (
              <div className="pt-2 flex gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Login</Button>
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="flex-1">
                  <Button
                    size="sm"
                    className="w-full text-white border-none"
                    style={{ background: `linear-gradient(to right, ${settings.ctaGradFrom}, ${settings.ctaGradTo})` }}
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
