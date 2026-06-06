// App shell composed from the bm-design-system MainNav pattern.
// See /design-system → Main navigation for the reference implementation.
import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import {
  ChevronsLeft,
  ChevronsRight,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  Tv,
  User,
  Users,
  X,
} from "lucide-react";

const STORAGE_KEY = "main-nav-open";

function useMainNavOpen() {
  const [open, setOpen] = React.useState(true);
  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setOpen(stored === "true");
  }, []);
  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(open));
  }, [open]);
  return [open, setOpen] as const;
}

interface NavItemDef {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const NAV_ITEMS: NavItemDef[] = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/workflows", icon: GitBranch, label: "Workflows" },
  { to: "/shows", icon: Tv, label: "Shows" },
  { to: "/processes", icon: ListChecks, label: "Processes" },
  { to: "/people", icon: Users, label: "People" },
];

function NavItem({
  item,
  open,
  onClick,
}: {
  item: NavItemDef;
  open: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <div className="group/nav-item relative">
      <Link
        to={item.to}
        onClick={onClick}
        aria-label={open ? undefined : item.label}
        activeOptions={{ exact: true }}
        className="no-underline"
      >
        {({ isActive }) => (
          <span
            className={cn(
              "flex items-center gap-3 rounded-md",
              open ? "px-3 py-2" : "mx-auto h-9 w-9 justify-center",
              isActive
                ? "bg-accent-faded text-accent-display"
                : "text-ink-body hover:bg-surface hover:text-ink-display",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {open && <span className="truncate">{item.label}</span>}
          </span>
        )}
      </Link>
      {!open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-[13px] -translate-y-1/2 whitespace-nowrap rounded-md border border-hairline bg-page px-2 py-1 text-xs font-medium text-ink-display opacity-0 shadow-sm transition-opacity group-hover/nav-item:opacity-100"
        >
          {item.label}
        </span>
      )}
    </div>
  );
}

function RailNav({ open, onClose }: { open: boolean; onClose?: () => void }) {
  return (
    <nav
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1 p-2 text-sm",
        open ? "overflow-x-hidden overflow-y-auto" : "overflow-visible",
      )}
    >
      {NAV_ITEMS.map((item) => (
        <NavItem key={item.to} item={item} open={open} onClick={onClose} />
      ))}
    </nav>
  );
}

function UserMenu({ open }: { open: boolean }) {
  const email = "you@example.com";
  const initial = email.charAt(0).toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={open ? undefined : email}
          className={cn(
            "group/user relative flex w-full cursor-pointer items-center gap-3 rounded-md text-left text-ink-body hover:bg-surface hover:text-ink-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            open ? "px-2 py-2" : "h-10 justify-center",
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-faded text-xs font-semibold text-accent">
            {initial}
          </span>
          {open ? (
            <span className="min-w-0 flex-1 truncate text-sm">{email}</span>
          ) : (
            <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-hairline bg-page px-2 py-1 text-xs font-medium text-ink-display opacity-0 shadow-md transition-opacity group-hover/user:opacity-100">
              {email}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="normal-case tracking-normal">
          <span className="block text-[10px] uppercase tracking-wider text-ink-muted">Signed in as</span>
          <span className="block truncate text-xs font-medium text-ink-display">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem><User /> Profile</DropdownMenuItem>
        <DropdownMenuItem><Settings /> Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          <ThemeToggle block />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem><LogOut /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useMainNavOpen();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-page text-ink-body">
      {/* Desktop rail */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-hairline bg-page transition-[width] duration-200 lg:flex",
          open ? "w-56" : "w-14",
        )}
      >
        {/* Brand row */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center gap-3 border-b border-hairline px-3",
            open ? "justify-between" : "justify-center",
          )}
        >
          <Link
            to="/dashboard"
            className="flex min-w-0 items-center gap-2 text-ink-display no-underline"
            aria-label="Home"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-faded font-display text-sm font-semibold text-accent">
              P
            </span>
            {open && (
              <span className="truncate font-display text-sm font-semibold">
                ProcessTool
              </span>
            )}
          </Link>
          {open && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-ink-display"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        <RailNav open={open} />

        {/* Expand chevron when collapsed */}
        {!open && (
          <div className="border-t border-hairline p-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-9 w-full cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-ink-display"
              aria-label="Expand sidebar"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="border-t border-hairline p-2">
          <UserMenu open={open} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-display/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-page shadow-xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-hairline px-4">
              <span className="font-display text-sm font-semibold text-ink-display">ProcessTool</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-ink-display"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <RailNav open onClose={() => setMobileOpen(false)} />
            <div className="border-t border-hairline p-2">
              <UserMenu open />
            </div>
          </aside>
        </div>
      )}

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed right-3 top-3 z-30 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-hairline bg-page text-ink-body hover:bg-surface lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Main content */}
      <main className="min-w-0 flex-1 px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-4xl">
          {children}
        </div>
      </main>
    </div>
  );
}
