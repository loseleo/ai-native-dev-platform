import { notFound } from "next/navigation";
import { CreateDialog } from "@/components/create-dialog";
import { ActionButton, DataTable, ReadOnlyBanner, RowActions, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createReview, updateReviewResult } from "@/lib/workspace-actions";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function ReviewsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }
  const canWrite = setup.databaseReady;

  return (
    <div className="space-y-6">
      <SectionHeader title="Reviews" description="PRD/Tech/UIUX/QA/Code/Acceptance reviews 在项目内沉淀评审结果、变更要求和开放问题。" />
      {!canWrite ? <ReadOnlyBanner /> : null}
      <div className="flex justify-end">
        <CreateDialog title="Create Review" trigger="Add Review" disabled={!canWrite}>
        <form action={createReview} className="grid gap-3 lg:grid-cols-[140px_160px_1fr_auto] lg:items-end">
          <input name="projectId" type="hidden" value={projectId} />
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="type">Type</label>
            <select id="type" name="type" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
              <option>PRD</option><option>Tech</option><option>UI/UX</option><option>QA Case</option><option>Code</option><option>PM Acceptance</option><option>Boss Acceptance</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="owner">Owner</label>
            <input id="owner" name="owner" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Kai" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="summary">Summary</label>
            <input id="summary" name="summary" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Review notes and required changes" />
          </div>
          <button disabled={!canWrite} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">Add Review</button>
        </form>
        </CreateDialog>
      </div>
      <TableShell title="Review Gates">
        <DataTable
          rows={data.reviews}
          getKey={(review) => review.id}
          columns={[
            { header: "ID", cell: (review) => <span className="font-mono text-xs">{review.id}</span> },
            { header: "Type", cell: (review) => <span className="font-semibold text-slate-950">{review.type}</span> },
            { header: "Owner", cell: (review) => review.owner },
            { header: "Result", cell: (review) => <StatusBadge value={review.result} /> },
            { header: "Summary", cell: (review) => <span className="line-clamp-2 max-w-xl">{review.summary}</span> },
            {
              header: "Actions",
              cell: (review) => (
                <RowActions>
                  {(["Pass", "Needs Change", "Pending"] as const).map((result) => (
                    <form key={result} action={updateReviewResult}>
                      <input name="projectId" type="hidden" value={projectId} />
                      <input name="reviewId" type="hidden" value={review.id} />
                      <input name="result" type="hidden" value={result} />
                      <ActionButton disabled={!canWrite}>{result}</ActionButton>
                    </form>
                  ))}
                </RowActions>
              ),
            },
          ]}
        />
      </TableShell>
    </div>
  );
}
