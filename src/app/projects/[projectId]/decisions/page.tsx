import { notFound } from "next/navigation";
import { DecisionCard } from "@/components/lists";
import { Card, SectionHeader } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createDecision } from "@/lib/workspace-actions";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function DecisionsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Decisions" description="这里展示该项目全部决策上下文；全局 Decision Inbox 只是 Boss 队列聚合入口。" />
      <Card className="p-4">
        <form action={createDecision} className="grid gap-3 lg:grid-cols-2">
          <input name="projectId" type="hidden" value={projectId} />
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="title">
              Decision Title
            </label>
            <input id="title" name="title" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Choose deployment strategy" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="raisedBy">
              Raised By
            </label>
            <input id="raisedBy" name="raisedBy" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Kai" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="recommendation">
              Recommendation
            </label>
            <textarea id="recommendation" name="recommendation" className="mt-2 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="Recommended option and rationale" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="impact">
              Impact
            </label>
            <textarea id="impact" name="impact" className="mt-2 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="Scope, schedule, quality, or cost impact" />
          </div>
          <input name="type" type="hidden" value="Technical trade-off" />
          <input name="status" type="hidden" value="Pending" />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input name="blocking" type="checkbox" />
            Blocking decision
          </label>
          <button disabled={!setup.databaseReady} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">
            Escalate to Boss
          </button>
        </form>
        {!setup.databaseReady ? <p className="mt-3 text-sm text-amber-700">未配置数据库时展示 demo seed 数据，真实决策写入会禁用。</p> : null}
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {data.decisions.map((decision) => (
          <DecisionCard key={decision.id} decision={decision} />
        ))}
      </div>
    </div>
  );
}
