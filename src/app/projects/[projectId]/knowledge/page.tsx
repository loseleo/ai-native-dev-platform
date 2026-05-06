import { notFound } from "next/navigation";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createKnowledgeDocument } from "@/lib/workspace-actions";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function KnowledgePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Knowledge Base" description="项目文档库以结构化 markdown 文档组织，所有文件都带 projectId 并服务于当前 Workspace。" />
      <Card className="p-4">
        <form action={createKnowledgeDocument} className="grid gap-3 lg:grid-cols-[160px_180px_1fr_auto] lg:items-end">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="filename" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="risks.md" />
          <input name="title" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Risks" />
          <input name="summary" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Current risk summary" />
          <button disabled={!setup.databaseReady} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">Save Doc</button>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.knowledgeDocs.map((doc) => (
          <Card key={doc.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-slate-950">{doc.title}</h2>
              <Badge tone="neutral">{doc.filename}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{doc.summary}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
