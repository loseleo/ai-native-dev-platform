import { notFound } from "next/navigation";
import { CreateDialog } from "@/components/create-dialog";
import { DataTable, ReadOnlyBanner, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createKnowledgeDocument } from "@/lib/workspace-actions";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function KnowledgePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }
  const canWrite = setup.databaseReady;

  return (
    <div className="space-y-6">
      <SectionHeader title="Knowledge Base" description="项目文档库以结构化 markdown 文档组织，所有文件都带 projectId 并服务于当前 Workspace。" />
      {!canWrite ? <ReadOnlyBanner /> : null}
      <div className="flex justify-end">
        <CreateDialog title="Save Knowledge Document" trigger="Save Doc" disabled={!canWrite}>
        <form action={createKnowledgeDocument} className="grid gap-3 lg:grid-cols-[160px_180px_1fr_auto] lg:items-end">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="filename" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="risks.md" />
          <input name="title" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Risks" />
          <input name="summary" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Current risk summary" />
          <button disabled={!canWrite} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">Save Doc</button>
        </form>
        </CreateDialog>
      </div>
      <TableShell title="Knowledge Documents">
        <DataTable
          rows={data.knowledgeDocs}
          getKey={(doc) => doc.id}
          columns={[
            { header: "Filename", cell: (doc) => <StatusBadge value={doc.filename} /> },
            { header: "Title", cell: (doc) => <span className="font-semibold text-slate-950">{doc.title}</span> },
            { header: "Summary", cell: (doc) => <span className="line-clamp-2 max-w-3xl">{doc.summary}</span> },
          ]}
        />
      </TableShell>
    </div>
  );
}
