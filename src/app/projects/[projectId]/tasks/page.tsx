import { notFound } from "next/navigation";
import { ActionButton, DataTable, ReadOnlyBanner, RowActions, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { reviewTaskApproval } from "@/lib/workspace-actions";
import { getSetupStatus } from "@/lib/setup";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function TasksPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }
  const canWrite = setup.databaseReady;

  return (
    <div className="space-y-6">
      <SectionHeader title="Tasks" description="任务由 PM/RD/QA 在 AI delivery plan 中拆解生成；这里不手工创建任务，只处理 Boss 审批门禁。" />
      {!canWrite ? <ReadOnlyBanner /> : null}
      <TableShell title="Plan Tasks">
        <DataTable
          rows={data.tasks}
          getKey={(task) => task.id}
          columns={[
            { header: "ID", cell: (task) => <span className="font-mono text-xs">{task.id}</span> },
            {
              header: "Task",
              cell: (task) => (
                <div>
                  <p className="font-semibold text-slate-950">{task.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{task.deliverable}</p>
                </div>
              ),
            },
            { header: "Priority", cell: (task) => <StatusBadge value={task.priority} /> },
            { header: "Status", cell: (task) => <StatusBadge value={task.status} /> },
            { header: "Stage", cell: (task) => <StatusBadge value={task.stage} /> },
            { header: "Team", cell: (task) => task.team },
            { header: "Owner", cell: (task) => task.owner },
            { header: "Reviewer", cell: (task) => task.reviewer },
            {
              header: "Boss Gate",
              cell: (task) => (
                <RowActions>
                  <form action={reviewTaskApproval} className="flex flex-wrap gap-1.5">
                    <input name="projectId" type="hidden" value={task.projectId} />
                    <input name="taskId" type="hidden" value={task.id} />
                    <input name="decision" type="hidden" value="approve" />
                    <input name="note" className="h-8 w-44 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-cyan-500" placeholder="Approval note" />
                    <ActionButton disabled={!canWrite || task.reviewer !== "Boss" || task.status === "Done"}>Approve</ActionButton>
                  </form>
                  <form action={reviewTaskApproval} className="flex flex-wrap gap-1.5">
                    <input name="projectId" type="hidden" value={task.projectId} />
                    <input name="taskId" type="hidden" value={task.id} />
                    <input name="decision" type="hidden" value="reject" />
                    <input name="note" className="h-8 w-44 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-cyan-500" placeholder="Reject reason" />
                    <ActionButton disabled={!canWrite || task.reviewer !== "Boss" || task.status === "Done"}>Reject</ActionButton>
                  </form>
                </RowActions>
              ),
            },
          ]}
        />
      </TableShell>
    </div>
  );
}
