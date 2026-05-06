"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Project } from "@/lib/data";
import { globalNavItems, workspaceNavItems } from "@/lib/navigation";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  projects = [],
  currentProject,
}: {
  projects?: Project[];
  currentProject?: Project;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      <div>
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Platform</p>
        <div className="mt-2 space-y-1">
          {globalNavItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-semibold transition ${
                  active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between px-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Projects</p>
          <Link href="/projects" className="text-xs font-semibold text-cyan-200 hover:text-white">
            All
          </Link>
        </div>
        <div className="mt-2 space-y-1">
          {projects.slice(0, 8).map((project) => {
            const active = pathname === `/projects/${project.id}` || pathname.startsWith(`/projects/${project.id}/`);

            return (
              <div key={project.id} className={active ? "rounded-md bg-white/10 p-1" : ""}>
                <Link
                  href={`/projects/${project.id}`}
                  className={`block rounded-md px-2 py-2 text-sm font-semibold transition ${
                    active ? "text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="block truncate">{project.name}</span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-500">{project.health} · {project.stage}</span>
                </Link>
                {active ? (
                  <div className="mt-1 space-y-0.5 border-l border-white/10 pl-2">
                    {workspaceNavItems.map((item) => {
                      const href = `/projects/${project.id}${item.href}`;
                      const itemActive = pathname === href;

                      return (
                        <Link
                          key={item.label}
                          href={href}
                          className={`block rounded px-2 py-1.5 text-xs font-semibold transition ${
                            itemActive ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
          {!projects.length ? <p className="px-3 py-2 text-xs text-slate-500">No projects yet.</p> : null}
        </div>
      </div>

      {currentProject ? (
        <div className="rounded-md border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Current Workspace</p>
          <p className="mt-2 text-sm font-semibold text-white">{currentProject.name}</p>
          <div className="mt-3 h-1.5 rounded-full bg-white/10">
            <div className="h-1.5 rounded-full bg-cyan-300" style={{ width: `${Math.max(0, Math.min(100, currentProject.progress))}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-400">{currentProject.progress}% complete</p>
        </div>
      ) : null}
    </nav>
  );
}
