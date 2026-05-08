import { notFound } from "next/navigation";
import { CreateDialog } from "@/components/create-dialog";
import { Card, DataTable, ReadOnlyBanner, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createDeployment, updateProjectDeploymentConfig } from "@/lib/workspace-actions";
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
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">Vercel Project Binding</h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure this after GitHub has code and the Vercel project exists or can be created from that repository.
            </p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[520px]">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Team / Owner</p>
              <p className="mt-1 font-medium text-slate-900">{data.project.vercelTeam || "Pending"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Project</p>
              <p className="mt-1 font-medium text-slate-900">{data.project.vercelProject || "Pending"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Preview</p>
              <p className="mt-1 break-all font-medium text-slate-900">{data.project.previewUrl || "Pending"}</p>
            </div>
          </div>
          <CreateDialog title="Configure Vercel Project" description="部署阶段绑定 Vercel。可以粘贴 dashboard URL，或手动填写 owner/team 与 project。" trigger="Configure Vercel" disabled={!canWrite}>
            <form action={updateProjectDeploymentConfig} className="space-y-4">
              <input name="projectId" type="hidden" value={projectId} />
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="vercelProjectUrl">Vercel Project URL</label>
                <input id="vercelProjectUrl" name="vercelProjectUrl" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="https://vercel.com/team/project" />
                <p className="mt-1 text-xs text-slate-500">If provided, team/owner and project will be derived automatically.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="vercelTeam">Team / Owner</label>
                  <input id="vercelTeam" name="vercelTeam" defaultValue={data.project.vercelTeam} className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="team-or-owner" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="vercelProject">Project</label>
                  <input id="vercelProject" name="vercelProject" defaultValue={data.project.vercelProject} className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="project-name" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="previewUrl">Preview URL</label>
                <input id="previewUrl" name="previewUrl" defaultValue={data.project.previewUrl} className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="https://project.vercel.app" />
              </div>
              <button disabled={!canWrite} className="h-10 w-full rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">
                Save Vercel Config
              </button>
            </form>
          </CreateDialog>
        </div>
      </Card>
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
