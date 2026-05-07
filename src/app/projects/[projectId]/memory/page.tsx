import { notFound } from "next/navigation";
import { Card, DataTable, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function MemoryPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await getWorkspaceData(projectId);

  if (!data.project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Memory" description="Project Ledger、Snapshot 和 Compressed Context 共同构成项目记忆，支持 Agent resume 和新成员 onboarding。" />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-950">Compressed Context</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p><strong className="text-slate-950">Goal:</strong> {data.project.goal}</p>
            <p><strong className="text-slate-950">Current Stage:</strong> {data.project.stage}</p>
            <p><strong className="text-slate-950">Progress:</strong> {data.project.progress}% with {data.tasks.filter((task) => task.status === "Blocked").length} blocked tasks.</p>
            <p><strong className="text-slate-950">AI Runs:</strong> {data.agentRuns.length} runs, {data.requirements.length} requirements, {data.codeChanges.length} code change packages.</p>
            <p><strong className="text-slate-950">What new Agent should do first:</strong> Read Requirements, Activity, Tasks, then Decisions.</p>
          </div>
        </Card>
        <TableShell title="Project Ledger">
          <DataTable
            rows={data.ledgerEvents}
            getKey={(event) => event.id}
            columns={[
              { header: "Time", cell: (event) => <StatusBadge value={event.time} /> },
              { header: "Object", cell: (event) => event.objectType ? <StatusBadge value={`${event.objectType}:${event.objectId ?? ""}`} /> : "Project" },
              { header: "Event", cell: (event) => <span className="font-semibold text-slate-950">{event.title}</span> },
              { header: "Detail", cell: (event) => <span className="line-clamp-2 max-w-2xl">{event.detail}</span> },
            ]}
          />
        </TableShell>
      </div>
    </div>
  );
}
