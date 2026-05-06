import { AppShell } from "@/components/app-shell";
import { ProjectCard } from "@/components/lists";
import { Card, SectionHeader } from "@/components/ui";
import { requireBossSession } from "@/lib/guards";
import { getSetupStatus } from "@/lib/setup";
import { createProject } from "@/lib/workspace-actions";
import { listProjects } from "@/lib/workspace-repository";

export default async function ProjectsPage() {
  const shell = await requireBossSession();
  const [projects, setup] = await Promise.all([listProjects(), getSetupStatus()]);

  return (
    <AppShell user={shell.user} setupLabel={shell.demoMode ? "Demo mode" : "Setup complete"}>
      <div className="space-y-6">
        <SectionHeader
          title="Projects"
          description="项目列表只负责创建、健康度扫描和进入 Workspace。Tasks、Bugs、Memory、Docs 等交付模块全部归属具体项目。"
        />
        <Card className="p-5">
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
              disabled={!setup.databaseReady}
              className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              type="submit"
            >
              Create Web Project
            </button>
          </form>
          {!setup.databaseReady ? <p className="mt-3 text-sm text-amber-700">当前未配置 `DATABASE_URL`，创建表单已禁用，页面会显示 demo seed 数据。</p> : null}
        </Card>
        <div className="grid gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-950">Creation flow</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            新项目创建后会生成默认 workflow、PM/RD/QA/UIUX assignments、Project Snapshot 和初始 ledger。
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
