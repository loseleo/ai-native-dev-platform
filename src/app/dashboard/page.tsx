import { AppShell } from "@/components/app-shell";
import { DataTable, ReadOnlyBanner, SectionHeader, StatCard, StatusBadge, TableShell } from "@/components/ui";
import { requireBossSession } from "@/lib/guards";
import { listDashboardData } from "@/lib/workspace-repository";
import Link from "next/link";

export default async function DashboardPage() {
  const shell = await requireBossSession();
  const { agents, bugs, decisions, projects, tasks } = await listDashboardData();
  const pendingBossDecisions = decisions.filter((decision) => decision.owner === "Boss" && decision.status !== "Resolved");
  const blockedTasks = tasks.filter((task) => task.status === "Blocked");
  const activeBugs = bugs.filter((bug) => bug.status !== "Closed");

  return (
    <AppShell user={shell.user} setupLabel={shell.demoMode ? "Demo mode" : "Setup complete"} projects={projects}>
      <div className="space-y-6">
        <SectionHeader
          title="Dashboard"
          description="跨项目摘要只展示 Boss 需要关注的健康度、阻塞决策和组织状态；具体交付细节进入 Project Workspace。"
        />
        {shell.demoMode ? <ReadOnlyBanner /> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Projects" value={String(projects.length)} detail="Active Web delivery workspaces" tone="info" />
          <StatCard label="Boss Decisions" value={String(pendingBossDecisions.length)} detail="Pending or needs more info" tone="warn" />
          <StatCard label="Blocked Tasks" value={String(blockedTasks.length)} detail="Must be resolved inside workspace" tone="bad" />
          <StatCard label="Active Agents" value={String(agents.filter((agent) => agent.status === "Working").length)} detail="Working across PM/RD/QA/UIUX" tone="good" />
        </div>
        <TableShell title="Boss Decision Queue" description="Only global pending/blocking items appear here; project context stays in the workspace.">
          <DataTable
            rows={pendingBossDecisions}
            getKey={(decision) => decision.id}
            columns={[
              {
                header: "Decision",
                cell: (decision) => (
                  <Link href={`/projects/${decision.projectId}/decisions`} className="font-semibold text-slate-950 hover:text-cyan-700">
                    {decision.title}
                  </Link>
                ),
              },
              { header: "Project", cell: (decision) => <Link href={`/projects/${decision.projectId}`} className="text-cyan-700 hover:text-cyan-900">{decision.projectId}</Link> },
              { header: "Status", cell: (decision) => <StatusBadge value={decision.status} /> },
              { header: "Blocking", cell: (decision) => <StatusBadge value={decision.blocking ? "Blocking" : "Non-blocking"} /> },
              { header: "Raised By", cell: (decision) => decision.raisedBy },
              { header: "Impact", cell: (decision) => <span className="line-clamp-2 max-w-xl">{decision.impact}</span> },
            ]}
          />
        </TableShell>
        <TableShell title="Project Health" description={`${activeBugs.length} active bugs are tracked inside project workspaces.`}>
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
              { header: "Next Action", cell: (project) => <span className="line-clamp-1">{project.nextActions[0] ?? "No action"}</span> },
              {
                header: "Workspace",
                cell: (project) => (
                  <Link href={`/projects/${project.id}/tasks`} className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">
                    Open tasks
                  </Link>
                ),
              },
            ]}
          />
        </TableShell>
      </div>
    </AppShell>
  );
}
