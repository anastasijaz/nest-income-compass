import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  CalendarDays,
  ListChecks,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

const TABS: {
  to: "/dashboard" | "/tasks" | "/calendar" | "/stats" | "/team";
  label: string;
  icon: LucideIcon;
  also?: string;
}[] = [
  { to: "/dashboard", label: "Properties", icon: Building2, also: "/properties" },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/calendar", label: "Visits", icon: CalendarDays },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/team", label: "Team", icon: UsersRound },
];

/** App-style tab bar fixed to the bottom of the screen, above the home indicator. */
export function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/80"
    >
      <ul className="mx-auto grid h-(--nav-h) max-w-xl grid-cols-5 px-[env(safe-area-inset-left)]">
        {TABS.map(({ to, label, icon: Icon, also }) => {
          const active = pathname.startsWith(to) || (!!also && pathname.startsWith(also));
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-secondary" : ""}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
