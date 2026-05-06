import Link from "next/link";
import { Badge, Card, ProgressBar } from "@/components/ui";
import type { Bug, Decision, Project, Task } from "@/lib/data";
import { updateBugStatus, updateDecisionStatus, updateTaskStatus } from "@/lib/workspace-actions";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">{project.type}</Badge>
            <Badge tone={project.health === "Healthy" ? "good" : project.health === "Blocked" ? "bad" : "warn"}>
              {project.health}
            </Badge>
          </div>
          <Link href={`/projects/${project.id}`} className="mt-3 block text-lg font-semibold text-slate-950 hover:text-cyan-700">
            {project.name}
          </Link>
          <p className="mt-2 text-sm leading-6 text-slate-600">{project.goal}</p>
        </div>
        <div className="min-w-48">
          <div className="flex justify-between text-sm font-semibold text-slate-600">
            <span>{project.stage}</span>
            <span>{project.progress}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={project.progress} />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function DecisionCard({ decision }: { decision: Decision }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={decision.blocking ? "bad" : "warn"}>{decision.blocking ? "Blocking" : "Non-blocking"}</Badge>
        <Badge tone={decision.status === "Pending" ? "warn" : "neutral"}>{decision.status}</Badge>
      </div>
      <h3 className="mt-3 text-base font-semibold text-slate-950">{decision.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{decision.recommendation}</p>
      <p className="mt-3 text-xs font-semibold uppercase text-slate-400">Impact</p>
      <p className="mt-1 text-sm text-slate-600">{decision.impact}</p>
      <Link href={`/projects/${decision.projectId}/decisions`} className="mt-4 inline-flex text-sm font-semibold text-cyan-700 hover:text-cyan-900">
        Open in Project Workspace
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["Approved", "Rejected", "Needs More Info"] as const).map((status) => (
          <form key={status} action={updateDecisionStatus}>
            <input name="projectId" type="hidden" value={decision.projectId} />
            <input name="decisionId" type="hidden" value={decision.id} />
            <input name="status" type="hidden" value={status} />
            <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50" type="submit">
              {status}
            </button>
          </form>
        ))}
      </div>
    </Card>
  );
}

export function TaskMiniCard({ task }: { task: Task }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <Badge tone={task.priority === "P0" ? "bad" : task.priority === "P1" ? "warn" : "neutral"}>{task.priority}</Badge>
        <Badge tone="info">{task.team}</Badge>
      </div>
      <h4 className="mt-3 text-sm font-semibold leading-5 text-slate-950">{task.title}</h4>
      <p className="mt-2 text-xs leading-5 text-slate-500">{task.deliverable}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{task.id}</span>
        <span>{task.owner}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["In Progress", "In Review", "Blocked", "Done"] as const).map((status) => (
          <form key={status} action={updateTaskStatus}>
            <input name="projectId" type="hidden" value={task.projectId} />
            <input name="taskId" type="hidden" value={task.id} />
            <input name="status" type="hidden" value={status} />
            <button className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50" type="submit">
              {status}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}

export function BugRow({ bug }: { bug: Bug }) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[120px_1fr_120px_120px] md:items-center">
      <Badge tone={bug.severity === "P0" ? "bad" : bug.severity === "P1" ? "warn" : "neutral"}>{bug.severity}</Badge>
      <div>
        <p className="font-semibold text-slate-950">{bug.title}</p>
        <p className="mt-1 text-sm text-slate-600">{bug.reproduction}</p>
      </div>
      <p className="text-sm font-semibold text-slate-600">{bug.owner}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={bug.status === "Closed" ? "good" : "warn"}>{bug.status}</Badge>
        {(["FIXING", "VERIFYING", "CLOSED"] as const).map((status) => (
          <form key={status} action={updateBugStatus}>
            <input name="projectId" type="hidden" value={bug.projectId} />
            <input name="bugId" type="hidden" value={bug.id} />
            <input name="status" type="hidden" value={status} />
            <button className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50" type="submit">
              {status}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
