import { notFound } from "next/navigation";
import { CreateDialog } from "@/components/create-dialog";
import { ActionButton, DataTable, ReadOnlyBanner, RowActions, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createBug, updateBugStatus } from "@/lib/workspace-actions";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function BugsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }
  const canWrite = setup.databaseReady;

  return (
    <div className="space-y-6">
      <SectionHeader title="Bugs" description="Bug 列表归属项目 Workspace，包含严重级别、复现路径、修复 owner 和验证状态。" />
      {!canWrite ? <ReadOnlyBanner /> : null}
      <div className="flex justify-end">
        <CreateDialog title="Create Bug" trigger="Add Bug" disabled={!canWrite}>
        <form action={createBug} className="grid gap-3 lg:grid-cols-[1fr_120px_140px_auto] lg:items-end">
          <input name="projectId" type="hidden" value={projectId} />
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="title">Bug Title</label>
            <input id="title" name="title" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Preview page overflow" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="severity">Severity</label>
            <select id="severity" name="severity" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
              <option>P0</option><option>P1</option><option>P2</option><option>P3</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="owner">Owner</label>
            <input id="owner" name="owner" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Nova" />
          </div>
          <input name="reproduction" type="hidden" value="Recorded from QA testing. Add details in bug detail view." />
          <button disabled={!canWrite} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">Add Bug</button>
        </form>
        </CreateDialog>
      </div>
      <TableShell title="Bug List">
        <DataTable
          rows={data.bugs}
          getKey={(bug) => bug.id}
          columns={[
            { header: "ID", cell: (bug) => <span className="font-mono text-xs">{bug.id}</span> },
            {
              header: "Bug",
              cell: (bug) => (
                <div>
                  <p className="font-semibold text-slate-950">{bug.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{bug.reproduction}</p>
                </div>
              ),
            },
            { header: "Severity", cell: (bug) => <StatusBadge value={bug.severity} /> },
            { header: "Status", cell: (bug) => <StatusBadge value={bug.status} /> },
            { header: "Owner", cell: (bug) => bug.owner },
            {
              header: "Actions",
              cell: (bug) => (
                <RowActions>
                  {(["FIXING", "VERIFYING", "CLOSED"] as const).map((status) => (
                    <form key={status} action={updateBugStatus}>
                      <input name="projectId" type="hidden" value={bug.projectId} />
                      <input name="bugId" type="hidden" value={bug.id} />
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
