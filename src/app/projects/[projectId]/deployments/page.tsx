import { notFound } from "next/navigation";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createDeployment } from "@/lib/workspace-actions";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function DeploymentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Deployments" description="Preview、Production URL、release record 和部署状态归属项目 Workspace，未来可接 Vercel API。" />
      <Card className="p-4">
        <form action={createDeployment} className="grid gap-3 lg:grid-cols-[160px_160px_1fr_auto] lg:items-end">
          <input name="projectId" type="hidden" value={projectId} />
          <select name="environment" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
            <option>Preview</option>
            <option>Production</option>
          </select>
          <input name="branch" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="dev" />
          <input name="url" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="https://..." />
          <button disabled={!setup.databaseReady} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">Add Deployment</button>
        </form>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {data.deployments.map((deployment) => (
          <Card key={deployment.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">{deployment.environment}</h2>
              <Badge tone={deployment.status === "Ready" ? "good" : deployment.status === "Failed" ? "bad" : "warn"}>{deployment.status}</Badge>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">Branch</dt>
                <dd className="mt-1 text-slate-800">{deployment.branch}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">URL</dt>
                <dd className="mt-1 break-all text-cyan-700">{deployment.url}</dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
    </div>
  );
}
