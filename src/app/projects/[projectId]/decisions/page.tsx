import { notFound } from "next/navigation";
import { CreateDialog } from "@/components/create-dialog";
import { ActionButton, DataTable, ReadOnlyBanner, RowActions, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createDecision, updateDecisionStatus } from "@/lib/workspace-actions";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function DecisionsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }
  const canWrite = setup.databaseReady;

  return (
    <div className="space-y-6">
      <SectionHeader title="Decisions" description="这里展示该项目全部决策上下文；全局 Decision Inbox 只是 Boss 队列聚合入口。" />
      {!canWrite ? <ReadOnlyBanner /> : null}
      <div className="flex justify-end">
        <CreateDialog title="Escalate Decision" trigger="Escalate Decision" disabled={!canWrite}>
        <form action={createDecision} className="grid gap-3 lg:grid-cols-2">
          <input name="projectId" type="hidden" value={projectId} />
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="title">
              Decision Title
            </label>
            <input id="title" name="title" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Choose deployment strategy" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="raisedBy">
              Raised By
            </label>
            <input id="raisedBy" name="raisedBy" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Kai" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="recommendation">
              Recommendation
            </label>
            <textarea id="recommendation" name="recommendation" className="mt-2 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="Recommended option and rationale" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="impact">
              Impact
            </label>
            <textarea id="impact" name="impact" className="mt-2 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="Scope, schedule, quality, or cost impact" />
          </div>
          <input name="type" type="hidden" value="Technical trade-off" />
          <input name="status" type="hidden" value="Pending" />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input name="blocking" type="checkbox" />
            Blocking decision
          </label>
          <button disabled={!canWrite} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">
            Escalate to Boss
          </button>
        </form>
        </CreateDialog>
      </div>
      <TableShell title="Project Decisions">
        <DataTable
          rows={data.decisions}
          getKey={(decision) => decision.id}
          columns={[
            { header: "ID", cell: (decision) => <span className="font-mono text-xs">{decision.id}</span> },
            {
              header: "Decision",
              cell: (decision) => (
                <div>
                  <p className="font-semibold text-slate-950">{decision.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{decision.recommendation}</p>
                </div>
              ),
            },
            { header: "Status", cell: (decision) => <StatusBadge value={decision.status} /> },
            { header: "Blocking", cell: (decision) => <StatusBadge value={decision.blocking ? "Blocking" : "Non-blocking"} /> },
            { header: "Raised By", cell: (decision) => decision.raisedBy },
            { header: "Impact", cell: (decision) => <span className="line-clamp-2 max-w-xl">{decision.impact}</span> },
            {
              header: "Actions",
              cell: (decision) => (
                <RowActions>
                  {(["Approved", "Rejected", "Needs More Info"] as const).map((status) => (
                    <form key={status} action={updateDecisionStatus}>
                      <input name="projectId" type="hidden" value={decision.projectId} />
                      <input name="decisionId" type="hidden" value={decision.id} />
                      <input name="status" type="hidden" value={status} />
                      <ActionButton disabled={!canWrite}>{status}</ActionButton>
                    </form>
                  ))}
                </RowActions>
              ),
            },
          ]}
        />
      </TableShell>
    </div>
  );
}
