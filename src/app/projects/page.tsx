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
            description="创建后自动生成初始 workflow、默认团队、知识库文档和 ledger。"
            trigger="Create Project"
            disabled={!canWrite}
          >
          <form action={createProject} className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
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
            <input name="repo" type="hidden" value="loseleo/ai-native-dev-platform" />
            <input name="previewUrl" type="hidden" value="" />
            <input name="nextActions" type="hidden" value={"Draft PRD\nAssign PM Lead\nCreate initial task board"} />
            <button
              disabled={!canWrite}
              className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              type="submit"
            >
              Create Web Project
            </button>
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
              { header: "Repo", cell: (project) => project.repo || "Not linked" },
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
