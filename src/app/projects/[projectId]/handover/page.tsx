import { notFound } from "next/navigation";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createHandover } from "@/lib/workspace-actions";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function HandoverPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Handover" description="交接包和 Agent onboarding brief 都在项目内生成，确保新 Agent 继承当前项目上下文。" />
      <Card className="p-4">
        <form action={createHandover} className="grid gap-3 lg:grid-cols-[140px_140px_1fr_1fr_auto] lg:items-end">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="fromAgent" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Kai" />
          <input name="toAgent" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="New RD" />
          <input name="objective" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Task objective" />
          <input name="scope" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Scope and out of scope" />
          <button disabled={!setup.databaseReady} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">Create</button>
        </form>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {data.handovers.map((handover) => (
          <Card key={handover.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">{handover.id}</h2>
              <Badge tone={handover.status === "Accepted" ? "good" : "warn"}>{handover.status}</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-500">From {handover.from} to {handover.to}</p>
            <p className="mt-4 font-semibold text-slate-950">{handover.objective}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{handover.scope}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
