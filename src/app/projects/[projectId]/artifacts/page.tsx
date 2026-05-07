import { notFound } from "next/navigation";
import { CreateDialog } from "@/components/create-dialog";
import { DataTable, ReadOnlyBanner, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createArtifact } from "@/lib/workspace-actions";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function ArtifactsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }
  const canWrite = setup.databaseReady;

  return (
    <div className="space-y-6">
      <SectionHeader title="Artifacts" description="PRD、设计稿、测试报告、代码说明和发布记录作为项目产物统一登记。" />
      {!canWrite ? <ReadOnlyBanner /> : null}
      <div className="flex justify-end">
        <CreateDialog title="Register Artifact" trigger="Register Artifact" disabled={!canWrite}>
        <form action={createArtifact} className="grid gap-3 lg:grid-cols-[1fr_160px_160px_auto] lg:items-end">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="name" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Release Note" />
          <select name="type" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
            <option>PRD</option><option>Design</option><option>QA Report</option><option>Code Note</option><option>Release Note</option>
          </select>
          <input name="owner" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Mira" />
          <button disabled={!canWrite} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">Register</button>
        </form>
        </CreateDialog>
      </div>
      <TableShell title="Artifact Registry">
        <DataTable
          rows={data.artifacts}
          getKey={(artifact) => artifact.id}
          columns={[
            { header: "ID", cell: (artifact) => <span className="font-mono text-xs">{artifact.id}</span> },
            { header: "Name", cell: (artifact) => <span className="font-semibold text-slate-950">{artifact.name}</span> },
            { header: "Type", cell: (artifact) => <StatusBadge value={artifact.type} /> },
            { header: "Owner", cell: (artifact) => artifact.owner },
            { header: "Status", cell: (artifact) => <StatusBadge value={artifact.status} /> },
          ]}
        />
      </TableShell>
      <TableShell title="AI Code Change Packages" description="AI generated code plans, protected PR packages, and GitHub approval state.">
        <DataTable
          rows={data.codeChanges}
          getKey={(change) => change.id}
          columns={[
            { header: "Branch", cell: (change) => <span className="font-mono text-xs">{change.branch}</span> },
            { header: "Status", cell: (change) => <StatusBadge value={change.status} /> },
            { header: "PR", cell: (change) => change.prUrl ? <span className="break-all text-cyan-700">{change.prUrl}</span> : "Pending" },
            { header: "Summary", cell: (change) => <span className="line-clamp-2 max-w-3xl">{change.summary}</span> },
          ]}
        />
      </TableShell>
    </div>
  );
}
