import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireBossSession } from "@/lib/guards";
import { getProjectById, listProjects } from "@/lib/workspace-repository";
import { AppShell } from "@/components/app-shell";
import { Badge, ProgressBar } from "@/components/ui";

export async function ProjectShell({ projectId, children }: { projectId: string; children: ReactNode }) {
  const shell = await requireBossSession();
  const [project, projects] = await Promise.all([getProjectById(projectId), listProjects()]);

  if (!project) {
    notFound();
  }

  return (
    <AppShell
      user={shell.user}
      setupLabel={shell.demoMode ? "Demo mode" : "Setup complete"}
      projects={projects}
      currentProject={project}
    >
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
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
              <h1 className="mt-2 text-xl font-semibold tracking-normal text-slate-950">{project.name}</h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{project.goal}</p>
            </div>
            <div className="min-w-64 rounded-md bg-slate-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">{project.stage}</span>
                <span className="font-semibold text-slate-950">{project.progress}%</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={project.progress} />
              </div>
            </div>
          </div>
        </section>
        {children}
      </div>
    </AppShell>
  );
}
