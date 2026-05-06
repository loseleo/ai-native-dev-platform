import { notFound } from "next/navigation";
import { TaskMiniCard } from "@/components/lists";
import { Card, SectionHeader } from "@/components/ui";
import { byStatus, workflowStages } from "@/lib/data";
import { createTask } from "@/lib/workspace-actions";
import { getSetupStatus } from "@/lib/setup";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function TasksPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Tasks" description="Jira-like Kanban 按 projectId 聚合，任务详情、owner、reviewer、deliverable 都保留项目上下文。" />
      <Card className="p-4">
        <form action={createTask} className="grid gap-3 xl:grid-cols-[1fr_140px_140px_140px_auto] xl:items-end">
          <input name="projectId" type="hidden" value={projectId} />
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="title">
              Task Title
            </label>
            <input id="title" name="title" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Implement workspace module" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="owner">
              Owner
            </label>
            <input id="owner" name="owner" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Nova" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="stage">
              Stage
            </label>
            <select id="stage" name="stage" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
              {workflowStages.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="priority">
              Priority
            </label>
            <select id="priority" name="priority" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
              <option>P0</option>
              <option>P1</option>
              <option>P2</option>
              <option>P3</option>
            </select>
          </div>
          <input name="team" type="hidden" value="RD" />
          <input name="status" type="hidden" value="Todo" />
          <input name="deliverable" type="hidden" value="Tracked workspace deliverable" />
          <input name="acceptance" type="hidden" value="Lead reviews and marks task done." />
          <button disabled={!setup.databaseReady} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">
            Add Task
          </button>
        </form>
        {!setup.databaseReady ? <p className="mt-3 text-sm text-amber-700">未配置数据库时展示 demo seed 数据，真实任务写入会禁用。</p> : null}
      </Card>
      <div className="grid gap-4 xl:grid-cols-5">
        {byStatus(data.tasks).map((column) => (
          <Card key={column.status} className="min-h-72 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">{column.status}</h2>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500">{column.tasks.length}</span>
            </div>
            <div className="mt-3 space-y-3">
              {column.tasks.map((task) => (
                <TaskMiniCard key={task.id} task={task} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
