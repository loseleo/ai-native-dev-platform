import { notFound } from "next/navigation";
import { CreateDialog } from "@/components/create-dialog";
import { ActionButton, Card, DataTable, ReadOnlyBanner, RowActions, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { getSetupStatus, listMaskedConfigs } from "@/lib/setup";
import {
  approveAndCreatePullRequest,
  approveRunPlan,
  createRequirementFromPrompt,
  generateCodePatch,
  markRequirementAccepted,
  planRequirementWithAI,
  syncVercelDeployment,
} from "@/lib/workspace-actions";
import { getWorkspaceData } from "@/lib/workspace-repository";

export default async function RequirementsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup, configs] = await Promise.all([getWorkspaceData(projectId), getSetupStatus(), listMaskedConfigs()]);

  if (!data.project) {
    notFound();
  }

  const canWrite = setup.databaseReady;
  const hasGitHubToken = configs.some((config) => config.scope === "GITHUB" && config.key === "TOKEN");
  const pmReady = data.agents.some((agent) => agent.team === "PM" && agent.keyConfigured && agent.availability === "Online");
  const rdReady = data.agents.some((agent) => agent.team === "RD" && agent.keyConfigured && agent.availability === "Online");
  const canStartDelivery = canWrite && pmReady && rdReady;
  const readiness = [
    { label: "PM Planning", value: pmReady ? "Ready" : "Blocked", detail: pmReady ? "Assigned PM Agent is ready." : "Configure PM in AI Organization, then assign an online idle PM Agent to this project." },
    { label: "RD Code Plan", value: rdReady ? "Ready" : "Blocked", detail: rdReady ? "Assigned RD Agent is ready." : "Configure RD in AI Organization, then assign an online idle RD Agent to this project." },
    { label: "GitHub PR", value: data.project.repo && hasGitHubToken ? "Ready" : "Blocked", detail: data.project.repo ? "Repository configured; GitHub token controls PR package creation." : "Project repository is missing." },
    { label: "Vercel Preview", value: data.project.vercelProject && data.project.vercelTeam ? "Ready" : "Blocked", detail: data.project.vercelProject ? "Project Vercel owner/project is configured." : "Vercel owner/project is missing." },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Requirements"
        description="从一句 Web 需求启动半自动 AI 交付：生成计划、Boss 审批、代码计划、PR 边界、部署记录和验收。"
      />
      {!canWrite ? <ReadOnlyBanner /> : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {readiness.map((item) => (
          <Card key={item.label} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">{item.label}</p>
              <StatusBadge value={item.value} />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.detail}</p>
          </Card>
        ))}
      </div>
      <div className="flex justify-end">
        <CreateDialog title="Start AI Delivery" description="先选择项目员工，再由 Boss 填写需求；平台随后创建 Requirement 和初始 AgentRun。" trigger="Start AI Delivery" disabled={!canStartDelivery}>
          <form action={createRequirementFromPrompt} className="space-y-4">
            <input name="projectId" type="hidden" value={projectId} />
            <div className="grid gap-3 md:grid-cols-2">
              <input name="title" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Todolist web app" />
              <input name="targetUsers" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Solo operators, small teams" />
            </div>
            <textarea name="prompt" className="min-h-28 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="做一个 todolist 网站，支持新增、完成、删除、筛选。" />
            <div className="grid gap-3 md:grid-cols-3">
              <textarea name="scope" className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="MVP scope" />
              <textarea name="acceptance" className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="Acceptance criteria" />
              <textarea name="techPreference" className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="Next.js + Tailwind + TypeScript" />
            </div>
            <div className="flex justify-end">
              <button disabled={!canStartDelivery} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">
                Create Requirement
              </button>
            </div>
          </form>
        </CreateDialog>
        {!canStartDelivery ? <p className="ml-3 self-center text-xs text-amber-700">Assign ready PM/RD agents first.</p> : null}
      </div>
      <TableShell title="AI Delivery Requirements" description="每个 Requirement 都有明确审批门禁；GitHub/Vercel 写入必须经 Boss 批准。">
        <DataTable
          rows={data.requirements}
          getKey={(requirement) => requirement.id}
          columns={[
            { header: "Requirement", cell: (requirement) => <span className="font-semibold text-slate-950">{requirement.title}</span> },
            { header: "Status", cell: (requirement) => <StatusBadge value={requirement.status} /> },
            { header: "Users", cell: (requirement) => requirement.targetUsers },
            { header: "Prompt", cell: (requirement) => <span className="line-clamp-2 max-w-xl">{requirement.prompt}</span> },
            { header: "Acceptance", cell: (requirement) => <span className="line-clamp-2 max-w-xl">{requirement.acceptance}</span> },
            {
              header: "Actions",
              cell: (requirement) => (
                <RowActions>
                  <form action={planRequirementWithAI}>
                    <input name="projectId" type="hidden" value={projectId} />
                    <input name="requirementId" type="hidden" value={requirement.id} />
                    <ActionButton disabled={!canWrite || !["Draft", "Blocked"].includes(requirement.status)}>Plan</ActionButton>
                  </form>
                  <form action={approveRunPlan}>
                    <input name="projectId" type="hidden" value={projectId} />
                    <input name="requirementId" type="hidden" value={requirement.id} />
                    <ActionButton disabled={!canWrite || requirement.status !== "Planned"}>Approve Plan</ActionButton>
                  </form>
                  <form action={generateCodePatch}>
                    <input name="projectId" type="hidden" value={projectId} />
                    <input name="requirementId" type="hidden" value={requirement.id} />
                    <ActionButton disabled={!canWrite || requirement.status !== "Approved"}>Generate Code</ActionButton>
                  </form>
                  <form action={approveAndCreatePullRequest}>
                    <input name="projectId" type="hidden" value={projectId} />
                    <input name="requirementId" type="hidden" value={requirement.id} />
                    <ActionButton disabled={!canWrite || requirement.status !== "Code Ready"}>Approve PR</ActionButton>
                  </form>
                  <form action={syncVercelDeployment}>
                    <input name="projectId" type="hidden" value={projectId} />
                    <input name="requirementId" type="hidden" value={requirement.id} />
                    <ActionButton disabled={!canWrite || !["PR Ready", "Code Ready"].includes(requirement.status)}>Sync Deploy</ActionButton>
                  </form>
                  <form action={markRequirementAccepted}>
                    <input name="projectId" type="hidden" value={projectId} />
                    <input name="requirementId" type="hidden" value={requirement.id} />
                    <ActionButton disabled={!canWrite || requirement.status !== "Deployed"}>Accept</ActionButton>
                  </form>
                </RowActions>
              ),
            },
          ]}
        />
      </TableShell>
      <TableShell title="Code Changes">
        <DataTable
          rows={data.codeChanges}
          getKey={(change) => change.id}
          columns={[
            { header: "Branch", cell: (change) => <span className="font-mono text-xs">{change.branch}</span> },
            { header: "Status", cell: (change) => <StatusBadge value={change.status} /> },
            { header: "PR", cell: (change) => change.prUrl ? <span className="break-all text-cyan-700">{change.prUrl}</span> : "Pending" },
            { header: "Summary", cell: (change) => <span className="line-clamp-2 max-w-3xl">{change.summary}</span> },
          ]}
        />
      </TableShell>
    </div>
  );
}
