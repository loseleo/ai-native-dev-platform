import Link from "next/link";
import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/ai-organization", label: "AI Organization" },
  { href: "/decision-inbox", label: "Decision Inbox" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({
  children,
  user,
  setupLabel = "Demo mode",
}: {
  children: ReactNode;
  user?: Session["user"];
  setupLabel?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-slate-950 px-4 py-5 text-white lg:block">
        <Link href="/dashboard" className="block rounded-md px-3 py-2">
          <p className="text-sm font-semibold text-cyan-200">Boss OS</p>
          <p className="mt-1 text-lg font-semibold">AI Native Dev Platform</p>
        </Link>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-semibold uppercase text-slate-400">System mode</p>
          <p className="mt-2 text-sm text-slate-200">Single Boss + Agent workers</p>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 lg:hidden">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-slate-950">Boss Command Center</p>
              <p className="text-xs text-slate-500">Global pages aggregate. Project delivery lives inside Workspace.</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">{setupLabel}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{user?.name ?? "Boss"}</span>
              {user ? <SignOutButton /> : null}
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
