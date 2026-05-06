import { notFound } from "next/navigation";
import { CreateDialog } from "@/components/create-dialog";
import { DataTable, ReadOnlyBanner, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createHandover } from "@/lib/workspace-actions";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function HandoverPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }
  const canWrite = setup.databaseReady;

  return (
    <div className="space-y-6">
      <SectionHeader title="Handover" description="交接包和 Agent onboarding brief 都在项目内生成，确保新 Agent 继承当前项目上下文。" />
      {!canWrite ? <ReadOnlyBanner /> : null}
      <div className="flex justify-end">
        <CreateDialog title="Create Handover Package" trigger="Create Handover" disabled={!canWrite}>
        <form action={createHandover} className="grid gap-3 lg:grid-cols-[140px_140px_1fr_1fr_auto] lg:items-end">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="fromAgent" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Kai" />
          <input name="toAgent" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="New RD" />
          <input name="objective" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Task objective" />
          <input name="scope" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Scope and out of scope" />
          <button disabled={!canWrite} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">Create</button>
        </form>
        </CreateDialog>
      </div>
      <TableShell title="Handover Packages">
        <DataTable
          rows={data.handovers}
          getKey={(handover) => handover.id}
          columns={[
            { header: "ID", cell: (handover) => <span className="font-mono text-xs">{handover.id}</span> },
            { header: "Status", cell: (handover) => <StatusBadge value={handover.status} /> },
            { header: "From", cell: (handover) => handover.from },
            { header: "To", cell: (handover) => handover.to },
            { header: "Objective", cell: (handover) => <span className="font-semibold text-slate-950">{handover.objective}</span> },
            { header: "Scope", cell: (handover) => <span className="line-clamp-2 max-w-xl">{handover.scope}</span> },
          ]}
        />
      </TableShell>
    </div>
  );
}
