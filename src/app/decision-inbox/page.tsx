import { AppShell } from "@/components/app-shell";
import { DataTable, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { requireBossSession } from "@/lib/guards";
import { listBossDecisions, listProjects } from "@/lib/workspace-repository";
import Link from "next/link";

export default async function DecisionInboxPage() {
  const shell = await requireBossSession();
  const [bossQueue, projects] = await Promise.all([listBossDecisions(), listProjects()]);

  return (
    <AppShell user={shell.user} setupLabel={shell.demoMode ? "Demo mode" : "Setup complete"} projects={projects}>
      <div className="space-y-6">
        <SectionHeader
          title="Decision Inbox"
          description="全局 Inbox 只聚合 Boss 待处理或阻塞决策。点击决策后回到对应 Project Workspace 的 Decisions 模块处理上下文。"
        />
        <TableShell title="Boss Pending Decisions">
          <DataTable
            rows={bossQueue}
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
              { header: "Priority", cell: (decision) => <StatusBadge value={decision.blocking ? "Blocking" : "Non-blocking"} /> },
              { header: "Raised By", cell: (decision) => decision.raisedBy },
              { header: "Recommendation", cell: (decision) => <span className="line-clamp-2 max-w-xl">{decision.recommendation}</span> },
              {
                header: "Action",
                cell: (decision) => (
                  <Link href={`/projects/${decision.projectId}/decisions`} className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">
                    Review
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
