import { AppShell } from "@/components/app-shell";
import { DecisionCard, ProjectCard } from "@/components/lists";
import { Card, SectionHeader, StatCard } from "@/components/ui";
import { requireBossSession } from "@/lib/guards";
import { listDashboardData } from "@/lib/workspace-repository";

export default async function DashboardPage() {
  const shell = await requireBossSession();
  const { agents, bugs, decisions, projects, tasks } = await listDashboardData();
  const pendingBossDecisions = decisions.filter((decision) => decision.owner === "Boss" && decision.status !== "Resolved");
  const blockedTasks = tasks.filter((task) => task.status === "Blocked");
  const activeBugs = bugs.filter((bug) => bug.status !== "Closed");

  return (
    <AppShell user={shell.user} setupLabel={shell.demoMode ? "Demo mode" : "Setup complete"}>
      <div className="space-y-6">
        <SectionHeader
          title="Dashboard"
          description="跨项目摘要只展示 Boss 需要关注的健康度、阻塞决策和组织状态；具体交付细节进入 Project Workspace。"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Projects" value={String(projects.length)} detail="Active Web delivery workspaces" tone="info" />
          <StatCard label="Boss Decisions" value={String(pendingBossDecisions.length)} detail="Pending or needs more info" tone="warn" />
          <StatCard label="Blocked Tasks" value={String(blockedTasks.length)} detail="Must be resolved inside workspace" tone="bad" />
          <StatCard label="Active Agents" value={String(agents.filter((agent) => agent.status === "Working").length)} detail="Working across PM/RD/QA/UIUX" tone="good" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-950">Project Health</h2>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-950">Boss Decision Queue</h2>
            {pendingBossDecisions.map((decision) => (
              <DecisionCard key={decision.id} decision={decision} />
            ))}
            <Card className="p-4">
              <p className="text-sm font-semibold text-slate-950">Quality signal</p>
              <p className="mt-2 text-sm text-slate-600">{activeBugs.length} active bugs are tracked inside their project workspaces.</p>
            </Card>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
