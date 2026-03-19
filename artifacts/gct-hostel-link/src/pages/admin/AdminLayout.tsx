import { useState, type ReactNode } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { Menu, Sun, Moon } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-background">
          <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-foreground text-sm">GCT Hostel Link</span>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
