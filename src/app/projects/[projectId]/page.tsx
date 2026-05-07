import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, Card, DataTable, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { workflowStages } from "@/lib/data";
import { getNextActionModule, getWorkflowModule } from "@/lib/navigation";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function ProjectOverviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await getWorkspaceData(projectId);

  if (!data.project) {
    notFound();
  }

  const currentIndex = workflowStages.indexOf(data.project.stage);
  const stats = [
    { label: "Tasks", value: data.tasks.length, detail: "Project-scoped delivery work", href: "tasks", tone: "info" as const },
    { label: "Open Bugs", value: data.bugs.filter((bug) => bug.status !== "Closed").length, detail: "Tracked by QA and RD", href: "bugs", tone: "warn" as const },
    { label: "Decisions", value: data.decisions.length, detail: "Escalations for this project", href: "decisions", tone: "bad" as const },
    { label: "Agents", value: data.agents.length, detail: "Assigned digital workers", href: "agents", tone: "good" as const },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Overview"
        description="项目快照、阶段、健康度和下一步动作集中在这里，作为 Workspace 的入口页。"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={`/projects/${projectId}${stat.href ? `/${stat.href}` : ""}`}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <Badge tone={stat.tone}>Open</Badge>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{stat.value}</p>
            <p className="mt-2 text-sm leading-5 text-slate-600">{stat.detail}</p>
          </Link>
        ))}
      </div>
      <Card className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Workflow</h2>
          <span className="text-sm font-semibold text-slate-500">Click a stage to open the owning workspace module</span>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {workflowStages.map((stage, index) => (
            <Link
              key={stage}
              href={`/projects/${projectId}/${getWorkflowModule(stage)}`}
              className={`rounded-md border p-3 ${
                index <= currentIndex ? "border-cyan-200 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-500"
              } transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900`}
            >
              <p className="text-xs font-semibold uppercase">Stage {index + 1}</p>
              <p className="mt-1 text-sm font-semibold">{stage}</p>
            </Link>
          ))}
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-950">Next Recommended Actions</h2>
          <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
            {data.project.nextActions.map((action) => (
              <Link
                key={action}
                href={`/projects/${projectId}/${getNextActionModule(action)}`}
                className="block bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-900"
              >
                {action}
              </Link>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-950">Project Snapshot</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Target users</dt>
              <dd className="mt-1 text-sm text-slate-700">{data.project.targetUsers}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Repository</dt>
              <dd className="mt-1 text-sm text-slate-700">
                <Link href={`/projects/${projectId}/artifacts`} className="font-semibold text-cyan-700 hover:text-cyan-900">
                  {data.project.repo || "Open artifacts"}
                </Link>
              </dd>
              <dd className="mt-1 text-xs text-slate-500">{data.project.gitProvider} · {data.project.gitBranch}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Preview</dt>
              <dd className="mt-1 text-sm text-slate-700">
                <Link href={`/projects/${projectId}/deployments`} className="font-semibold text-cyan-700 hover:text-cyan-900">
                  {data.project.previewUrl || "Open deployments"}
                </Link>
              </dd>
              <dd className="mt-1 text-xs text-slate-500">{data.project.vercelProject || "Vercel project pending"} · {data.project.vercelTeam || "team pending"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Database</dt>
              <dd className="mt-1 text-sm text-slate-700">{data.project.databaseProvider}</dd>
              <dd className="mt-1 text-xs text-slate-500">{data.project.databaseConfigured ? "Connection URL configured" : "Connection URL pending"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Health</dt>
              <dd className="mt-1">
                <Badge tone={data.project.health === "Healthy" ? "good" : "warn"}>{data.project.health}</Badge>
              </dd>
            </div>
          </dl>
        </Card>
      </div>
      <TableShell title="Project Agent Summary" description="成员增删和项目绑定在 Agents 模块处理。">
        <DataTable
          rows={data.agents}
          getKey={(agent) => agent.id}
          columns={[
            { header: "Agent", cell: (agent) => <Link href={`/projects/${projectId}/agents`} className="font-semibold text-slate-950 hover:text-cyan-700">{agent.name}</Link> },
            { header: "Team", cell: (agent) => <StatusBadge value={agent.team} /> },
            { header: "Role", cell: (agent) => agent.role },
            { header: "Provider", cell: (agent) => `${agent.provider} / ${agent.model}` },
            { header: "Status", cell: (agent) => <StatusBadge value={agent.status} /> },
            { header: "Capabilities", cell: (agent) => <span className="line-clamp-1">{agent.capabilities.join(", ")}</span> },
          ]}
        />
      </TableShell>
    </div>
  );
}
