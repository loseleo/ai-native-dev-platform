import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireBossSession } from "@/lib/guards";
import { getProjectById } from "@/lib/workspace-repository";
import { AppShell } from "@/components/app-shell";
import { Badge, ProgressBar } from "@/components/ui";

const workspaceNav = [
  { href: "", label: "Overview" },
  { href: "/tasks", label: "Tasks" },
  { href: "/bugs", label: "Bugs" },
  { href: "/reviews", label: "Reviews" },
  { href: "/decisions", label: "Decisions" },
  { href: "/memory", label: "Memory" },
  { href: "/knowledge", label: "Knowledge Base" },
  { href: "/handover", label: "Handover" },
  { href: "/deployments", label: "Deployments" },
  { href: "/artifacts", label: "Artifacts" },
];

export async function ProjectShell({ projectId, children }: { projectId: string; children: ReactNode }) {
  const shell = await requireBossSession();
  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <AppShell user={shell.user} setupLabel={shell.demoMode ? "Demo mode" : "Setup complete"}>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/projects" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
                  Projects
                </Link>
                <span className="text-slate-300">/</span>
                <Badge tone="info">Project Workspace</Badge>
                <Badge tone={project.health === "Healthy" ? "good" : project.health === "Blocked" ? "bad" : "warn"}>
                  {project.health}
                </Badge>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-normal text-slate-950">{project.name}</h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{project.goal}</p>
            </div>
            <div className="min-w-64 rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">{project.stage}</span>
                <span className="font-semibold text-slate-950">{project.progress}%</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={project.progress} />
              </div>
            </div>
          </div>
          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {workspaceNav.map((item) => (
              <Link
                key={item.label}
                href={`/projects/${project.id}${item.href}`}
                className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </section>
        {children}
      </div>
    </AppShell>
  );
}
