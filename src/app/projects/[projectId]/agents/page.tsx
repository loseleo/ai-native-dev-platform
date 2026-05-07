import { notFound } from "next/navigation";
import Link from "next/link";
import { CreateDialog } from "@/components/create-dialog";
import { DataTable, ReadOnlyBanner, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { assignAgentToProject, createAgent } from "@/lib/workspace-actions";
import { getWorkspaceData, listAgents } from "@/lib/workspace-repository";

export default async function ProjectAgentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, setup, globalAgents] = await Promise.all([getWorkspaceData(projectId), getSetupStatus(), listAgents()]);

  if (!data.project) {
    notFound();
  }

  const canWrite = setup.databaseReady;
  const assignedIds = new Set(data.agents.map((agent) => agent.id));
  const availableAgents = globalAgents.filter((agent) => !assignedIds.has(agent.id));
  const providers = ["gpt", "gemini", "minimax", "claude"] as const;

  return (
    <div className="space-y-6">
      <SectionHeader title="Agents" description="Project Agents 管理当前项目成员绑定；全局 Agent 池仍由 AI Organization 统一维护。" />
      {!canWrite ? <ReadOnlyBanner /> : null}
      <div className="flex flex-wrap justify-end gap-3">
        <CreateDialog title="Create and Join Project" description="为当前 Workspace 创建新 Agent，并自动写入 ledger。" trigger="Create Agent" disabled={!canWrite}>
          <form action={createAgent} className="space-y-4">
            <input name="projectId" type="hidden" value={projectId} />
            <div className="grid gap-3 md:grid-cols-[1fr_120px_160px]">
              <input name="name" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Agent name" />
              <select name="team" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
                <option>PM</option><option>RD</option><option>QA</option><option>UI/UX</option>
              </select>
              <input name="role" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="RD Agent" />
            </div>
            <div className="grid gap-3 md:grid-cols-[140px_1fr_1fr]">
              <select name="provider" defaultValue="gpt" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
                {providers.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
              </select>
              <input name="model" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Model, blank uses provider default" />
              <input name="apiKey" type="password" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="API key, stored encrypted" />
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input name="capabilities" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Next.js, QA, PRD..." />
              <button disabled={!canWrite} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit">
                Add Agent
              </button>
            </div>
          </form>
        </CreateDialog>
        <CreateDialog title="Assign Existing Global Agent" description="从 AI Organization 的全局池加入当前项目。" trigger="Assign Agent" disabled={!canWrite}>
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
          <Link href="/ai-organization" className="mt-3 inline-flex text-sm font-semibold text-cyan-700 hover:text-cyan-900">
            Open global agent pool
          </Link>
        </CreateDialog>
      </div>
      <TableShell title="Project Members">
        <DataTable
          rows={data.agents}
          getKey={(agent) => agent.id}
          columns={[
            { header: "Agent", cell: (agent) => <span className="font-semibold text-slate-950">{agent.name}</span> },
            { header: "Team", cell: (agent) => <StatusBadge value={agent.team} /> },
            { header: "Role", cell: (agent) => agent.role },
            { header: "Provider", cell: (agent) => `${agent.provider} / ${agent.model}` },
            { header: "API Key", cell: (agent) => <StatusBadge value={agent.keyConfigured ? "Configured" : "Pending"} /> },
            { header: "Status", cell: (agent) => <StatusBadge value={agent.status} /> },
            { header: "Capabilities", cell: (agent) => <span className="line-clamp-1 max-w-xl">{agent.capabilities.join(", ")}</span> },
            { header: "Source", cell: (agent) => agent.projectIds.includes(projectId) ? "Assigned to project" : "Global pool" },
          ]}
        />
      </TableShell>
    </div>
  );
}
