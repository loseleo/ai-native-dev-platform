import { notFound } from "next/navigation";
import { Badge, Card, SectionHeader, StatCard } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createAgent } from "@/lib/workspace-actions";
import { workflowStages } from "@/lib/data";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function ProjectOverviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }

  const currentIndex = workflowStages.indexOf(data.project.stage);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Overview"
        description="项目快照、阶段、健康度和下一步动作集中在这里，作为 Workspace 的入口页。"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tasks" value={String(data.tasks.length)} detail="Project-scoped delivery work" tone="info" />
        <StatCard label="Open Bugs" value={String(data.bugs.filter((bug) => bug.status !== "Closed").length)} detail="Tracked by QA and RD" tone="warn" />
        <StatCard label="Decisions" value={String(data.decisions.length)} detail="Escalations for this project" tone="bad" />
        <StatCard label="Agents" value={String(data.agents.length)} detail="Assigned digital workers" tone="good" />
      </div>
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-950">Workflow</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {workflowStages.map((stage, index) => (
            <div
              key={stage}
              className={`rounded-md border p-3 ${
                index <= currentIndex ? "border-cyan-200 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              <p className="text-xs font-semibold uppercase">Stage {index + 1}</p>
              <p className="mt-1 text-sm font-semibold">{stage}</p>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-950">Next Recommended Actions</h2>
          <div className="mt-4 space-y-3">
            {data.project.nextActions.map((action) => (
              <div key={action} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                {action}
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-950">Project Snapshot</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Target users</dt>
              <dd className="mt-1 text-sm text-slate-700">{data.project.targetUsers}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Repository</dt>
              <dd className="mt-1 text-sm text-slate-700">{data.project.repo}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Preview</dt>
              <dd className="mt-1 text-sm text-slate-700">{data.project.previewUrl}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Health</dt>
              <dd className="mt-1">
                <Badge tone={data.project.health === "Healthy" ? "good" : "warn"}>{data.project.health}</Badge>
              </dd>
            </div>
          </dl>
        </Card>
      </div>
      <Card className="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Project Agents</h2>
            <p className="mt-1 text-sm text-slate-600">项目内只展示参与当前 Workspace 的 Agent。</p>
          </div>
          <form action={createAgent} className="grid gap-2 sm:grid-cols-[140px_120px_150px_1fr_auto]">
            <input name="projectId" type="hidden" value={projectId} />
            <input name="name" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Agent name" />
            <select name="team" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
              <option>PM</option><option>RD</option><option>QA</option><option>UI/UX</option>
            </select>
            <input name="role" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="RD Agent" />
            <input name="capabilities" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Next.js, QA, PRD..." />
            <button disabled={!setup.databaseReady} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">Add</button>
          </form>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {data.agents.map((agent) => (
            <div key={agent.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{agent.name}</p>
                  <p className="text-sm text-slate-500">{agent.role}</p>
                </div>
                <Badge tone={agent.status === "Working" ? "good" : agent.status === "Blocked" ? "bad" : "neutral"}>{agent.team}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
