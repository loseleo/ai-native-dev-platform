import { AppShell } from "@/components/app-shell";
import { CreateDialog } from "@/components/create-dialog";
import Link from "next/link";
import { DataTable, ReadOnlyBanner, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { requireBossSession } from "@/lib/guards";
import { getSetupStatus } from "@/lib/setup";
import { createProject } from "@/lib/workspace-actions";
import { listProjects } from "@/lib/workspace-repository";

export default async function ProjectsPage() {
  const shell = await requireBossSession();
  const [projects, setup] = await Promise.all([listProjects(), getSetupStatus()]);
  const canWrite = setup.databaseReady && !shell.demoMode;

  return (
    <AppShell
      user={shell.user}
      setupLabel={shell.demoMode ? "Demo mode" : "Setup complete"}
      projects={projects}
    >
      <div className="space-y-6">
        <SectionHeader
          title="Projects"
          description="项目列表只负责创建、健康度扫描和进入 Workspace。Tasks、Bugs、Memory、Docs 等交付模块全部归属具体项目。"
        />
        {!canWrite ? <ReadOnlyBanner /> : null}
        <div className="flex justify-end">
          <CreateDialog
            title="Create Web Project from Template"
            description="创建时只绑定 Git 仓库和数据库上下文；Vercel 在 Deployment 阶段配置。"
            trigger="Create Project"
            disabled={!canWrite}
          >
            <form action={createProject} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="name">
                    Project Name
                  </label>
                  <input id="name" name="name" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="New Web Project" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="goal">
                    Business Goal
                  </label>
                  <input id="goal" name="goal" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="What should this project deliver?" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="targetUsers">
                    Target Users
                  </label>
                  <input id="targetUsers" name="targetUsers" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Boss, PM, RD..." />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-950">Git Repository</h3>
                <div className="mt-3 grid gap-4 md:grid-cols-[160px_1fr_160px]">
                  <div>
                    <label className="text-sm font-semibold text-slate-700" htmlFor="gitProvider">Provider</label>
                    <select id="gitProvider" name="gitProvider" defaultValue="GitHub" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
                      <option>GitHub</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700" htmlFor="gitUrl">Git URL</label>
                    <input id="gitUrl" name="gitUrl" required className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="https://github.com/loseleo/ai-native-dev-platform" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700" htmlFor="gitBranch">Branch</label>
                    <input id="gitBranch" name="gitBranch" defaultValue="main" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="repo">Repository Override</label>
                  <input id="repo" name="repo" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Optional owner/repo override" />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-950">Project Database</h3>
                <div className="mt-3 grid gap-4 md:grid-cols-[220px_1fr]">
                  <div>
                    <label className="text-sm font-semibold text-slate-700" htmlFor="databaseProvider">Provider</label>
                    <select id="databaseProvider" name="databaseProvider" defaultValue="Supabase Postgres" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
                      <option>Supabase Postgres</option>
                      <option>Vercel Postgres</option>
                      <option>External Postgres</option>
                      <option>MySQL</option>
                      <option>SQLite</option>
                      <option>None / Frontend Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700" htmlFor="projectDatabaseUrl">Database URL</label>
                    <input id="projectDatabaseUrl" name="projectDatabaseUrl" type="password" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Stored encrypted. Leave blank if not ready." />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">Vercel project binding happens later in the Deployments workspace, after the GitHub repository has code.</p>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <label className="text-sm font-semibold text-slate-700" htmlFor="nextActions">Initial Next Actions</label>
                <textarea id="nextActions" name="nextActions" defaultValue={"Draft PRD\nAssign PM Lead\nCreate initial task board"} className="mt-2 min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
              </div>

              <div className="flex justify-end">
                <button
                  disabled={!canWrite}
                  className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  type="submit"
                >
                  Create Web Project
                </button>
              </div>
            </form>
          </CreateDialog>
        </div>
        <TableShell title="Project List" description="进入项目后，左侧 Projects 节点会展开完整 Workspace tree。">
          <DataTable
            rows={projects}
            getKey={(project) => project.id}
            columns={[
              {
                header: "Project",
                cell: (project) => (
                  <div>
                    <Link href={`/projects/${project.id}`} className="font-semibold text-slate-950 hover:text-cyan-700">
                      {project.name}
                    </Link>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">{project.goal}</p>
                  </div>
                ),
              },
              { header: "Health", cell: (project) => <StatusBadge value={project.health} /> },
              { header: "Stage", cell: (project) => <StatusBadge value={project.stage} /> },
              { header: "Progress", cell: (project) => `${project.progress}%` },
              {
                header: "Git",
                cell: (project) => (
                  <div className="text-sm">
                    <p className="font-medium text-slate-900">{project.repo || "Not linked"}</p>
                    <p className="text-xs text-slate-500">{project.gitProvider} · {project.gitBranch}</p>
                  </div>
                ),
              },
              {
                header: "Vercel",
                cell: (project) => (
                  <div className="text-sm">
                    <p className="font-medium text-slate-900">{project.vercelProject || "Not linked"}</p>
                    <p className="text-xs text-slate-500">{project.vercelTeam || "Team pending"}</p>
                  </div>
                ),
              },
              {
                header: "Database",
                cell: (project) => (
                  <div className="text-sm">
                    <p className="font-medium text-slate-900">{project.databaseProvider}</p>
                    <p className="text-xs text-slate-500">{project.databaseConfigured ? "Configured" : "Pending"}</p>
                  </div>
                ),
              },
              {
                header: "Quick Links",
                cell: (project) => (
                  <div className="flex flex-wrap gap-2">
                    {["tasks", "bugs", "memory", "deployments"].map((module) => (
                      <Link key={module} href={`/projects/${project.id}/${module}`} className="text-xs font-semibold text-cyan-700 hover:text-cyan-900">
                        {module}
                      </Link>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </TableShell>
      </div>
    </AppShell>
  );
}
