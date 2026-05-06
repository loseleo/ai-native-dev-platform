import { notFound } from "next/navigation";
import { CreateDialog } from "@/components/create-dialog";
import { ActionButton, DataTable, ReadOnlyBanner, RowActions, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { workflowStages } from "@/lib/data";
import { createTask, updateTaskStatus } from "@/lib/workspace-actions";
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
      <SectionHeader title="Tasks" description="任务按 projectId 聚合，默认使用紧凑表格保留 owner、reviewer、deliverable 和状态流转。" />
      {!canWrite ? <ReadOnlyBanner /> : null}
      <div className="flex justify-end">
        <CreateDialog title="Create Task" trigger="Add Task" disabled={!canWrite}>
        <form action={createTask} className="grid gap-3 xl:grid-cols-[1fr_140px_140px_140px_auto] xl:items-end">
          <input name="projectId" type="hidden" value={projectId} />
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="title">
              Task Title
            </label>
            <input id="title" name="title" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Implement workspace module" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="owner">
              Owner
            </label>
            <input id="owner" name="owner" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Nova" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="stage">
              Stage
            </label>
            <select id="stage" name="stage" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
              {workflowStages.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="priority">
              Priority
            </label>
            <select id="priority" name="priority" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
              <option>P0</option>
              <option>P1</option>
              <option>P2</option>
              <option>P3</option>
            </select>
          </div>
          <input name="team" type="hidden" value="RD" />
          <input name="status" type="hidden" value="Todo" />
          <input name="deliverable" type="hidden" value="Tracked workspace deliverable" />
          <input name="acceptance" type="hidden" value="Lead reviews and marks task done." />
          <button disabled={!canWrite} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">
            Add Task
          </button>
        </form>
        </CreateDialog>
      </div>
      <TableShell title="Task Board">
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
            {
              header: "Actions",
              cell: (task) => (
                <RowActions>
                  {(["In Progress", "In Review", "Blocked", "Done"] as const).map((status) => (
                    <form key={status} action={updateTaskStatus}>
                      <input name="projectId" type="hidden" value={task.projectId} />
                      <input name="taskId" type="hidden" value={task.id} />
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
