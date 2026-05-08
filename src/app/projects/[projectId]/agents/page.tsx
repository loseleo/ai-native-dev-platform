import { notFound } from "next/navigation";
import Link from "next/link";
import { CreateDialog } from "@/components/create-dialog";
import { DataTable, ReadOnlyBanner, RowActions, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { assignAgentToProject, forceStopProjectAgent, releaseProjectAgent } from "@/lib/workspace-actions";
import { getWorkspaceData, listAgents } from "@/lib/workspace-repository";

export default async function ProjectAgentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup, globalAgents] = await Promise.all([getWorkspaceData(projectId), getSetupStatus(), listAgents()]);

  if (!data.project) {
    notFound();
  }

  const canWrite = setup.databaseReady;
  const assignedIds = new Set(data.agents.map((agent) => agent.id));
  const availableAgents = globalAgents.filter((agent) => agent.status === "Idle" && agent.availability === "Online" && !assignedIds.has(agent.id));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Project Agents"
        description="项目只能从 AI Organization 借调在线且空闲的 Agent；密钥、模型和 prompt 统一在组织层配置。"
      />
      {!canWrite ? <ReadOnlyBanner /> : null}
      <div className="flex flex-wrap justify-end gap-3">
        <CreateDialog title="Assign Idle Agent" description="从全局组织池选择在线且空闲的 Agent 加入当前项目执行队列。" trigger="Assign Agent" disabled={!canWrite}>
          <form action={assignAgentToProject} className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input name="projectId" type="hidden" value={projectId} />
            <select name="agentId" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
              {availableAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} · {agent.team} · {agent.role} · {agent.provider}/{agent.model}
                </option>
              ))}
            </select>
            <button disabled={!canWrite || !availableAgents.length} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">
              Assign
            </button>
          </form>
          {!availableAgents.length ? <p className="mt-3 text-sm text-amber-700">No online idle agents available. Release a project assignment or enable agents in AI Organization.</p> : null}
          <Link href="/ai-organization" className="mt-3 inline-flex text-sm font-semibold text-cyan-700 hover:text-cyan-900">
            Open AI Organization
          </Link>
        </CreateDialog>
      </div>
      <TableShell title="Active Project Assignments" description="项目运行状态、强停、释放和交接摘要都会写入 Activity 与 Memory。">
        <DataTable
          rows={data.agents}
          getKey={(agent) => agent.id}
          columns={[
            { header: "Agent", cell: (agent) => <span className="font-semibold text-slate-950">{agent.name}</span> },
            { header: "Team", cell: (agent) => <StatusBadge value={agent.team} /> },
            { header: "Role", cell: (agent) => agent.role },
            { header: "Provider", cell: (agent) => `${agent.provider} / ${agent.model}` },
            { header: "Runtime", cell: (agent) => <StatusBadge value={agent.status} /> },
            { header: "Availability", cell: (agent) => <StatusBadge value={agent.availability} /> },
            { header: "Prompt", cell: (agent) => <span className="line-clamp-2 max-w-xl">{agent.systemPrompt || agent.userPrompt || "Prompt pending in AI Organization"}</span> },
            {
              header: "Actions",
              cell: (agent) => (
                <RowActions>
                  <CreateDialog title={`Release ${agent.name}`} description="完成项目工作后，填写交接摘要并把 Agent 归还到 idle pool。" trigger="Release" disabled={!canWrite}>
                    <form action={releaseProjectAgent} className="space-y-3">
                      <input name="projectId" type="hidden" value={projectId} />
                      <input name="agentId" type="hidden" value={agent.id} />
                      <textarea name="summary" className="min-h-28 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="完成了哪些产物、当前风险、下个 Agent 如何接手" />
                      <div className="flex justify-end">
                        <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white" type="submit">Release Agent</button>
                      </div>
                    </form>
                  </CreateDialog>
                  <CreateDialog title={`Force Stop ${agent.name}`} description="用于处理假死或异常运行；会阻塞相关 run、写入 ledger，并把 Agent 退回 idle。" trigger="Force Stop" disabled={!canWrite}>
                    <form action={forceStopProjectAgent} className="space-y-3">
                      <input name="projectId" type="hidden" value={projectId} />
                      <input name="agentId" type="hidden" value={agent.id} />
                      <textarea name="reason" className="min-h-28 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="为什么强停、已观察到的卡点、后续处理建议" />
                      <div className="flex justify-end">
                        <button className="h-10 rounded-md bg-rose-700 px-4 text-sm font-semibold text-white" type="submit">Force Stop</button>
                      </div>
                    </form>
                  </CreateDialog>
                </RowActions>
              ),
            },
          ]}
        />
      </TableShell>
    </div>
  );
}
