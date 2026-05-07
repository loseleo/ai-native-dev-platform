import { notFound } from "next/navigation";
import { Card, DataTable, SectionHeader, StatCard, StatusBadge, TableShell } from "@/components/ui";
import { getWorkspaceData } from "@/lib/workspace-repository";

function classifyEvent(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("decision")) {
    return "Decision";
  }

  if (normalized.includes("bug")) {
    return "Bug";
  }

  if (normalized.includes("review")) {
    return "Review";
  }

  if (normalized.includes("agent")) {
    return "Agent";
  }

  if (normalized.includes("task")) {
    return "Task";
  }

  return "Project";
}

export default async function ActivityPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await getWorkspaceData(projectId);

  if (!data.project) {
    notFound();
  }

  const activity = data.ledgerEvents.map((event) => ({
    ...event,
    type: classifyEvent(event.title),
  }));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Activity"
        description="Agent run log、配置视角和项目事件流集中在这里，用于追踪 AI workers 的执行状态、失败、重试和决策升级。"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Agents" value={String(data.agents.length)} detail="Assigned to this workspace" tone="info" />
        <StatCard label="Runs" value={String(data.agentRuns.length)} detail="Real AI delivery runs" tone="good" />
        <StatCard label="Blocked Runs" value={String(data.agentRuns.filter((run) => run.status === "Blocked" || run.status === "Failed").length)} detail="Need Boss or setup action" tone="bad" />
        <StatCard label="Ledger Events" value={String(data.ledgerEvents.length)} detail="Tracked project memory entries" tone="warn" />
      </div>
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-950">Runtime Defaults</h2>
        <dl className="mt-4 grid gap-4 text-sm md:grid-cols-4">
          <div>
            <dt className="font-semibold text-slate-500">Provider</dt>
            <dd className="mt-1 text-slate-900">Per-agent</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Default model</dt>
            <dd className="mt-1 text-slate-900">Provider default</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Config version</dt>
            <dd className="mt-1 text-slate-900">workspace-default-v1</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Tool policy</dt>
            <dd className="mt-1 text-slate-900">Project scoped</dd>
          </div>
        </dl>
      </Card>
      <TableShell title="Agent Run Log" description="Real Requirement → AgentRun records, including approval gates and execution errors.">
        <DataTable
          rows={data.agentRuns}
          getKey={(run) => run.id}
          columns={[
            { header: "Run", cell: (run) => <span className="font-mono text-xs">{run.id}</span> },
            { header: "Agent", cell: (run) => <span className="font-semibold text-slate-950">{run.agentName}</span> },
            { header: "Type", cell: (run) => <StatusBadge value={run.type} /> },
            { header: "Model", cell: (run) => `${run.provider} / ${run.model}` },
            { header: "Status", cell: (run) => <StatusBadge value={run.status} /> },
            { header: "Input", cell: (run) => <span className="line-clamp-1 max-w-xl">{run.input}</span> },
            { header: "Output", cell: (run) => <span className="line-clamp-2 max-w-xl">{run.error || run.output || "Pending"}</span> },
            { header: "Created", cell: (run) => <StatusBadge value={run.createdAt} /> },
          ]}
        />
      </TableShell>
      <TableShell title="Run Steps" description="Step-level trace for planning, code generation, PR approval, deployment sync, and acceptance.">
        <DataTable
          rows={data.agentRunSteps}
          getKey={(step) => step.id}
          columns={[
            { header: "Run", cell: (step) => <span className="font-mono text-xs">{step.runId}</span> },
            { header: "Step", cell: (step) => <span className="font-semibold text-slate-950">{step.name}</span> },
            { header: "Status", cell: (step) => <StatusBadge value={step.status} /> },
            { header: "Detail", cell: (step) => <span className="line-clamp-2 max-w-3xl">{step.error || step.output || step.detail}</span> },
            { header: "Created", cell: (step) => <StatusBadge value={step.createdAt} /> },
          ]}
        />
      </TableShell>
      <TableShell title="Activity Timeline" description="Ledger events classified by project object type.">
        <DataTable
          rows={activity}
          getKey={(event) => event.id}
          columns={[
            { header: "Time", cell: (event) => <StatusBadge value={event.time} /> },
            { header: "Type", cell: (event) => <StatusBadge value={event.type} /> },
            { header: "Event", cell: (event) => <span className="font-semibold text-slate-950">{event.title}</span> },
            { header: "Detail", cell: (event) => <span className="line-clamp-2 max-w-3xl">{event.detail}</span> },
          ]}
        />
      </TableShell>
    </div>
  );
}
