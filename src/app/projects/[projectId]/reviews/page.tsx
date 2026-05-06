import { notFound } from "next/navigation";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { createReview, updateReviewResult } from "@/lib/workspace-actions";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function ReviewsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup] = await Promise.all([getWorkspaceData(projectId), getSetupStatus()]);

  if (!data.project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Reviews" description="PRD/Tech/UIUX/QA/Code/Acceptance reviews 在项目内沉淀评审结果、变更要求和开放问题。" />
      <Card className="p-4">
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
          <button disabled={!setup.databaseReady} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">Add Review</button>
        </form>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {data.reviews.map((review) => (
          <Card key={review.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">{review.type} Review</h2>
              <Badge tone={review.result === "Pass" ? "good" : review.result === "Needs Change" ? "warn" : "neutral"}>{review.result}</Badge>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-500">Owner: {review.owner}</p>
            <p className="mt-4 text-sm leading-6 text-slate-600">{review.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["Pass", "Needs Change", "Pending"] as const).map((result) => (
                <form key={result} action={updateReviewResult}>
                  <input name="projectId" type="hidden" value={projectId} />
                  <input name="reviewId" type="hidden" value={review.id} />
                  <input name="result" type="hidden" value={result} />
                  <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50" type="submit">
                    {result}
                  </button>
                </form>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
