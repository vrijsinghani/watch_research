import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Search, 
  History, 
  Settings, 
  Watch, 
  Menu
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { icon: Search, label: "Market Search", href: "/" },
    { icon: LayoutDashboard, label: "Analysis Dashboard", href: "/dashboard" },
    { icon: History, label: "History", href: "/history" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Watch className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-display font-bold tracking-wider text-primary">CHRONOS</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group cursor-pointer",
                location === item.href
                  ? "bg-sidebar-accent text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              )}
              onClick={() => setIsOpen(false)}
            >
              <item.icon className={cn("w-5 h-5 transition-colors", location === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-sidebar-border">
        <div className="bg-sidebar-accent/50 rounded-lg p-4">
          <h4 className="font-medium text-sm text-foreground mb-1">Pro Status</h4>
          <p className="text-xs text-muted-foreground mb-3">Your subscription is active until Dec 2025.</p>
          <div className="h-1.5 w-full bg-sidebar-border rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[75%]" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-sidebar border-sidebar-border">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r border-sidebar-border bg-sidebar">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}
