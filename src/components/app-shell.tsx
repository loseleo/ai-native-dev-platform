import Link from "next/link";
import type { ReactNode } from "react";
import type { Session } from "next-auth";
import type { Project } from "@/lib/data";
import { SidebarNav } from "@/components/sidebar-nav";
import { SignOutButton } from "@/components/sign-out-button";

export function AppShell({
  children,
  user,
  setupLabel = "Demo mode",
  projects = [],
  currentProject,
}: {
  children: ReactNode;
  user?: Session["user"];
  setupLabel?: string;
  projects?: Project[];
  currentProject?: Project;
}) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-slate-950 text-white md:flex md:flex-col">
        <div className="px-4 py-5">
          <Link href="/dashboard" className="block rounded-md px-3 py-2">
            <p className="text-sm font-semibold text-cyan-200">Boss OS</p>
            <p className="mt-1 text-lg font-semibold">AI Native Dev Platform</p>
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28">
          <SidebarNav projects={projects} currentProject={currentProject} />
        </div>
        <div className="absolute bottom-5 left-4 right-4 rounded-md border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-semibold uppercase text-slate-400">System mode</p>
          <p className="mt-2 text-sm text-slate-200">Single Boss + Agent workers</p>
        </div>
      </aside>
      <div className="md:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
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
