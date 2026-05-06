import { notFound } from "next/navigation";
import { Badge, Card, SectionHeader } from "@/components/ui";
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
            <p><strong className="text-slate-950">What new Agent should do first:</strong> Read PRD, open Tasks, then check Decisions.</p>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-950">Project Ledger</h2>
          <div className="mt-4 space-y-4">
            {data.ledgerEvents.map((event) => (
              <div key={event.id} className="grid gap-3 border-l-2 border-cyan-200 pl-4 md:grid-cols-[70px_1fr]">
                <Badge tone="info">{event.time}</Badge>
                <div>
                  <p className="font-semibold text-slate-950">{event.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
