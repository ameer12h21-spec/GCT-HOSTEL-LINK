import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { signOut } from "@/lib/auth";
import { SidebarNetworkIndicator } from "@/components/NetworkIndicator";
import {
  LayoutDashboard, Users, CalendarCheck, MessageSquare,
  DollarSign, UserCog, BookOpen, Trash2, LogOut,
  Sun, Moon, User, Zap, Building2, X,
  CreditCard, History, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const adminNav: NavItem[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/students", icon: Users, label: "Students" },
  { href: "/admin/attendance", icon: CalendarCheck, label: "Attendance" },
  { href: "/admin/complaints", icon: MessageSquare, label: "Complaints" },
  { href: "/admin/mess-fees", icon: DollarSign, label: "Mess Fees" },
  { href: "/admin/electricity", icon: Zap, label: "Electricity Bills" },
  { href: "/admin/staff", icon: UserCog, label: "Teachers & Staff" },
  { href: "/admin/admissions", icon: BookOpen, label: "Admissions" },
  { href: "/admin/trash", icon: Trash2, label: "Trash & Audit" },
  { href: "/admin/profile", icon: Settings, label: "Profile & Settings" },
];

const studentNav: NavItem[] = [
  { href: "/student", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/student/profile", icon: User, label: "My Profile" },
  { href: "/student/attendance", icon: CalendarCheck, label: "Attendance" },
  { href: "/student/mess-fees", icon: DollarSign, label: "Mess Fees" },
  { href: "/student/electricity", icon: Zap, label: "Electricity Bills" },
  { href: "/student/complaints", icon: MessageSquare, label: "Complaints" },
];

const teacherNav: NavItem[] = [
  { href: "/teacher", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/teacher/students", icon: Users, label: "Students" },
  { href: "/teacher/attendance", icon: CalendarCheck, label: "Attendance" },
  { href: "/teacher/electricity", icon: Zap, label: "Electricity Bills" },
  { href: "/teacher/complaints", icon: MessageSquare, label: "Complaints" },
  { href: "/teacher/mess-fees", icon: DollarSign, label: "Mess Fees" },
  { href: "/teacher/profile", icon: Settings, label: "Profile & Settings" },
];

const messNav: NavItem[] = [
  { href: "/mess", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/mess/students", icon: Users, label: "Students" },
  { href: "/mess/fees", icon: CreditCard, label: "Fees Management" },
  { href: "/mess/payments", icon: History, label: "Payment History" },
  { href: "/mess/profile", icon: Settings, label: "Profile & Settings" },
];

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case "admin": return adminNav;
    case "student": return studentNav;
    case "teacher": return teacherNav;
    case "mess_owner": return messNav;
    default: return [];
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "admin": return "Administrator";
    case "student": return "Student";
    case "teacher": return "Teacher";
    case "mess_owner": return "Mess Owner";
    default: return role;
  }
}

interface Props {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function DashboardSidebar({ mobileOpen, onMobileClose }: Props) {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSiteSettings();
  const [location] = useLocation();

  if (!profile) return null;

  const navItems = getNavItems(profile.role);

  async function handleSignOut() {
    await signOut();
    window.location.href = "/";
  }

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/teacher" || href === "/student" || href === "/mess") {
      return location === href;
    }
    return location === href || location.startsWith(href + "/");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-white text-xs leading-tight truncate">{settings.siteName}</div>
            <div className="text-xs text-sidebar-foreground/60 truncate">{settings.siteSubtitle}</div>
          </div>
        </Link>
        {onMobileClose && (
          <button onClick={onMobileClose} className="lg:hidden text-sidebar-foreground/60 hover:text-white ml-2">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
            {profile.profile_photo_url
              ? <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
              : profile.name.charAt(0).toUpperCase()
            }
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-white truncate">{profile.name}</div>
            <div className="text-xs text-sidebar-foreground/60">{getRoleLabel(profile.role)}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-primary text-white shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-2">
        <SidebarNetworkIndicator />
      </div>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent w-full transition-all"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 w-full transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={onMobileClose} />
          <div className="relative flex flex-col w-60 bg-sidebar h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
