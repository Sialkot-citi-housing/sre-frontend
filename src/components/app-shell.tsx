import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarClock,
  ChevronDown,
  CornerDownLeft,
  FileText,
  HardHat,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";
import { projects } from "@/lib/projects-data";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  matchPrefix?: string;
};

const nav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ledgers", label: "Project Ledgers", icon: FileText, matchPrefix: "/projects" },
  { to: "/office-expenses", label: "Office Expenses", icon: Wallet },
  { to: "/quotations", label: "Smart Quotations", icon: Sparkles },
];

type SearchHit =
  | { kind: "project"; id: string; title: string; sub: string; to: string }
  | { kind: "page"; title: string; sub: string; to: string };

const PAGE_INDEX: { title: string; sub: string; to: string; keywords: string }[] = [
  { title: "Dashboard", sub: "Overview & alerts", to: "/dashboard", keywords: "dashboard home overview alerts widgets" },
  { title: "Project Ledgers", sub: "Portfolio of active projects", to: "/ledgers", keywords: "ledgers projects portfolio plots" },
  { title: "Office Expenses", sub: "Overhead expense register", to: "/office-expenses", keywords: "office expenses overhead utilities rent fuel" },
  { title: "Smart Quotations", sub: "AI-powered estimation", to: "/quotations", keywords: "quotations quotes estimate naqsha" },
];

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [today, setToday] = useState<string>("");

  useEffect(() => {
    const d = new Date();
    setToday(
      d.toLocaleDateString("en-PK", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }),
    );
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const hits = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const projectHits: SearchHit[] = projects
      .filter(
        (p) =>
          p.plot.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q) ||
          p.phase.toLowerCase().includes(q) ||
          p.size.toLowerCase().includes(q),
      )
      .slice(0, 6)
      .map((p) => ({
        kind: "project",
        id: p.id,
        title: `${p.plot} — ${p.size}`,
        sub: `${p.client} · ${p.phase}`,
        to: `/projects/${p.id}`,
      }));
    const pageHits: SearchHit[] = PAGE_INDEX.filter((p) =>
      (p.title + " " + p.keywords).toLowerCase().includes(q),
    ).map((p) => ({ kind: "page", title: p.title, sub: p.sub, to: p.to }));
    return [...projectHits, ...pageHits].slice(0, 8);
  }, [query]);

  const goToHit = (h: SearchHit) => {
    setSearchOpen(false);
    setQuery("");
    navigate({ to: h.to });
  };

  const isActive = (item: NavItem) => {
    if (item.to === "/ledgers" && (pathname === "/ledgers" || pathname.startsWith("/projects"))) return true;
    if (item.matchPrefix && pathname.startsWith(item.matchPrefix)) return true;
    return pathname === item.to;
  };

  const signOut = () => {
    if (typeof window !== "undefined") window.localStorage.removeItem("sre_auth");
    navigate({ to: "/" });
  };

  const SearchBox = ({ className = "" }: { className?: string }) => (
    <div ref={searchRef} className={`relative ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (hits[0]) goToHit(hits[0]);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search plots, clients, pages…"
          className="h-10 w-[280px] pl-9 pr-9"
        />
        {query ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">
            <CornerDownLeft className="inline h-3.5 w-3.5" />
          </span>
        ) : null}
      </form>
      {searchOpen && query ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {hits.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              No matches for "{query}"
            </div>
          ) : (
            <ul className="max-h-80 overflow-auto py-1">
              {hits.map((h, i) => (
                <li key={`${h.kind}-${i}`}>
                  <button
                    onClick={() => goToHit(h)}
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                  >
                    <div className={`mt-0.5 rounded-md p-1.5 ${h.kind === "project" ? "bg-[color:var(--sre-blue)]/10 text-[color:var(--sre-blue)]" : "bg-secondary text-muted-foreground"}`}>
                      {h.kind === "project" ? <HardHat className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{h.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{h.sub}</div>
                    </div>
                    <span className="ml-auto self-center text-[10px] uppercase tracking-wider text-muted-foreground">
                      {h.kind}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );

  const SidebarContents = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="flex h-20 items-center gap-3 border-b border-border px-5">
        <img src="/sre-logo.png" alt="Sialkot Real Estate" className="h-10 w-auto object-contain" />
        <div className="leading-tight">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-destructive">
            SRE
          </div>
          <div className="text-xs font-medium text-muted-foreground">Construction Portal</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        {nav.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[color:var(--sre-blue)] text-primary-foreground"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "" : "text-muted-foreground"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs">
          <div className="font-semibold text-foreground">Need support?</div>
          <div className="mt-1 text-muted-foreground">Contact internal IT — ext. 204</div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <SidebarContents />
      </aside>

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-card">
          <div className="flex h-16 items-center gap-3 px-4 sm:h-20 sm:gap-6 sm:px-6">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="flex h-full flex-col">
                  <SidebarContents onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold tracking-tight text-foreground sm:text-xl">
                {title ?? "Project Ledgers"}
              </h1>
              {subtitle ? (
                <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{subtitle}</p>
              ) : null}
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <SearchBox className="hidden xl:block" />
              <Button variant="ghost" size="icon" aria-label="Search" className="xl:hidden" onClick={() => setMobileOpen(false)}>
                <Search className="h-5 w-5" />
              </Button>
              <div className="hidden items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 md:flex">
                <CalendarClock className="h-4 w-4 text-[color:var(--sre-blue)]" />
                <div className="leading-tight">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Site day</div>
                  <div className="text-xs font-semibold text-foreground">{today || "—"}</div>
                </div>
              </div>
              <div className="hidden items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 lg:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-emerald-700">All sites live</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-left transition-colors hover:bg-secondary sm:gap-3 sm:px-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--sre-blue)] text-xs font-semibold text-primary-foreground sm:h-9 sm:w-9 sm:text-sm">
                      AK
                    </div>
                    <div className="hidden leading-tight md:block">
                      <div className="text-sm font-semibold text-foreground">A. Khan</div>
                      <div className="text-xs text-muted-foreground">Project Manager</div>
                    </div>
                    <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:inline-block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>My account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Team</DropdownMenuItem>
                  <DropdownMenuItem>Audit log</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-[color:var(--sre-red)] focus:text-[color:var(--sre-red)]">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}