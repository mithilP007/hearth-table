import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Compass, CalendarCheck, User, Flame } from "lucide-react";

const NAV = [
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/my-bookings", label: "My Bookings", icon: CalendarCheck },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function CustomerShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-cream/90 backdrop-blur">
        <div className="ht-shell flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-terracotta text-primary-foreground">
              <Flame className="size-4" aria-hidden />
            </span>
            <span className="font-serif text-lg font-semibold">Hearth &amp; Table</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="ht-shell py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card md:hidden">
        <ul className="flex">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <Link
                to={to}
                activeProps={{ className: "text-terracotta" }}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
