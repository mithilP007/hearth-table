import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  CalendarClock,
  Inbox,
  Settings,
  Menu,
  Flame,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/producer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/producer/products", label: "Products", icon: Package },
  { to: "/producer/availability", label: "Availability", icon: CalendarClock },
  { to: "/producer/bookings", label: "Bookings", icon: Inbox },
  { to: "/producer/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeProps={{ className: "bg-accent text-accent-foreground font-semibold" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-cream hover:text-foreground"
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function ProducerShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1280px]">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border bg-card px-4 py-6 lg:block">
          <Link to="/" className="mb-6 flex items-center gap-2 px-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-terracotta text-primary-foreground">
              <Flame className="size-4" aria-hidden />
            </span>
            <span className="font-serif text-base font-semibold">Hearth &amp; Table</span>
          </Link>
          <NavList />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-cream/90 px-4 backdrop-blur lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-card p-4">
                <div className="mb-6 mt-2 flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-terracotta text-primary-foreground">
                    <Flame className="size-4" aria-hidden />
                  </span>
                  <span className="font-serif text-base font-semibold">Producer studio</span>
                </div>
                <NavList onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="font-serif text-lg font-semibold">Producer studio</span>
          </header>

          <main className="px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
