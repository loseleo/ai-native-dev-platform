import { notFound } from "next/navigation";
import { CreateDialog } from "@/components/create-dialog";
import { DataTable, ReadOnlyBanner, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createDeployment } from "@/lib/workspace-actions";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function DeploymentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }
  const canWrite = setup.databaseReady;

  return (
    <div className="space-y-6">
      <SectionHeader title="Deployments" description="Preview、Production URL、release record 和部署状态归属项目 Workspace；AI delivery run 可同步 preview deployment 记录。" />
      {!canWrite ? <ReadOnlyBanner /> : null}
      <div className="flex justify-end">
        <CreateDialog title="Register Deployment" trigger="Add Deployment" disabled={!canWrite}>
        <form action={createDeployment} className="grid gap-3 lg:grid-cols-[160px_160px_1fr_auto] lg:items-end">
          <input name="projectId" type="hidden" value={projectId} />
          <select name="environment" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
            <option>Preview</option>
            <option>Production</option>
          </select>
          <input name="branch" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="dev" />
          <input name="url" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="https://..." />
          <button disabled={!canWrite} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">Add Deployment</button>
        </form>
        </CreateDialog>
      </div>
      <TableShell title="Deployment Records">
        <DataTable
          rows={data.deployments}
          getKey={(deployment) => deployment.id}
          columns={[
            { header: "Environment", cell: (deployment) => <StatusBadge value={deployment.environment} /> },
            { header: "Status", cell: (deployment) => <StatusBadge value={deployment.status} /> },
            { header: "Branch", cell: (deployment) => deployment.branch },
            { header: "Build", cell: (deployment) => <StatusBadge value={deployment.buildStatus || "Manual"} /> },
            { header: "Run", cell: (deployment) => deployment.sourceRunId ? <span className="font-mono text-xs">{deployment.sourceRunId}</span> : "Manual" },
            { header: "URL", cell: (deployment) => <span className="break-all text-cyan-700">{deployment.url}</span> },
            { header: "Logs", cell: (deployment) => deployment.logsUrl ? <span className="break-all text-cyan-700">{deployment.logsUrl}</span> : "Pending" },
          ]}
        />
      </TableShell>
    </div>
  );
}
