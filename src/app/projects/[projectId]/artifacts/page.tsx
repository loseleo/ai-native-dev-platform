import { notFound } from "next/navigation";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createArtifact } from "@/lib/workspace-actions";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function ArtifactsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Artifacts" description="PRD、设计稿、测试报告、代码说明和发布记录作为项目产物统一登记。" />
      <Card className="p-4">
        <form action={createArtifact} className="grid gap-3 lg:grid-cols-[1fr_160px_160px_auto] lg:items-end">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="name" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Release Note" />
          <select name="type" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
            <option>PRD</option><option>Design</option><option>QA Report</option><option>Code Note</option><option>Release Note</option>
          </select>
          <input name="owner" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Mira" />
          <button disabled={!setup.databaseReady} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">Register</button>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.artifacts.map((artifact) => (
          <Card key={artifact.id} className="p-5">
            <Badge tone={artifact.status === "Approved" ? "good" : "neutral"}>{artifact.status}</Badge>
            <h2 className="mt-4 font-semibold text-slate-950">{artifact.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{artifact.type}</p>
            <p className="mt-4 text-xs font-semibold uppercase text-slate-400">Owner</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{artifact.owner}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
