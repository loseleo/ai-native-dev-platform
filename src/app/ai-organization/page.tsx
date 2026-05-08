import { AppShell } from "@/components/app-shell";
import { CreateDialog } from "@/components/create-dialog";
import { ActionButton, DataTable, ReadOnlyBanner, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { requireBossSession } from "@/lib/guards";
import { getSetupStatus } from "@/lib/setup";
import { createGlobalAgent, updateGlobalAgent } from "@/lib/workspace-actions";
import { listAgents, listProjects } from "@/lib/workspace-repository";

export default async function AiOrganizationPage() {
  const shell = await requireBossSession();
  const [agents, setup, projects] = await Promise.all([listAgents(), getSetupStatus(), listProjects()]);
  const canWrite = setup.databaseReady && !shell.demoMode;
  const teams = ["PM", "RD", "QA", "UI/UX"] as const;
  const providers = ["gpt", "gemini", "minimax", "claude"] as const;

  return (
    <AppShell user={shell.user} setupLabel={shell.demoMode ? "Demo mode" : "Setup complete"} projects={projects}>
      <div className="space-y-6">
        <SectionHeader
          title="AI Organization"
          description="全局组织层管理 Agent、Team、capability 和 lifecycle；项目内只展示参与该项目的 Agent。"
        />
        {!canWrite ? <ReadOnlyBanner /> : null}
        <div className="flex justify-end">
          <CreateDialog
            title="Create Global Agent"
            description="全局 Agent 只配置模型、密钥和 prompt；项目只能从在线且空闲的组织池借调。"
            trigger="Add Agent"
            disabled={!canWrite}
          >
            <form action={createGlobalAgent} className="mt-4 space-y-5">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="name">Name</label>
                  <input id="name" name="name" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Atlas" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="team">Team</label>
                  <select id="team" name="team" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
                    {teams.map((team) => <option key={team}>{team}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="role">Role</label>
                  <input id="role" name="role" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="RD Agent" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr]">
                <div>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="provider">Provider</label>
                  <select id="provider" name="provider" defaultValue="gpt" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
                    {providers.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="model">Model</label>
                  <input id="model" name="model" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="gpt-5.4 / gemini-2.5-pro / claude-sonnet-4.5" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="apiKey">API Key</label>
                  <input id="apiKey" name="apiKey" type="password" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Stored encrypted" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                <div>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="systemPrompt">System Prompt</label>
                  <textarea id="systemPrompt" name="systemPrompt" className="mt-2 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="Agent role, constraints, output quality bar" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="availability">Availability</label>
                  <select id="availability" name="availability" defaultValue="ONLINE" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
                    <option value="ONLINE">ONLINE</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="userPrompt">User Prompt</label>
                <textarea id="userPrompt" name="userPrompt" className="mt-2 min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="Default task instruction injected into project runs" />
              </div>
              <div className="flex justify-end">
                <button
                  disabled={!canWrite}
                  className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  type="submit"
                >
                  Add Agent
                </button>
              </div>
            </form>
          </CreateDialog>
        </div>
        <TableShell title="Global Agent Pool" description="组织池只管理在线/离线、模型和 prompt；Working/Idle 由项目运行记录驱动，不能在这里手动切换。">
          <DataTable
            rows={agents}
            getKey={(agent) => agent.id}
            columns={[
              {
                header: "Agent",
                cell: (agent) => (
                  <form action={updateGlobalAgent} id={`agent-${agent.id}`} className="min-w-48">
                    <input name="agentId" type="hidden" value={agent.id} />
                    <input
                      name="name"
                      defaultValue={agent.name}
                      disabled={!canWrite}
                      className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-500 disabled:bg-slate-50"
                    />
                  </form>
                ),
              },
              {
                header: "Provider",
                cell: (agent) => (
                  <div className="space-y-2">
                    <select
                      name="provider"
                      form={`agent-${agent.id}`}
                      defaultValue={agent.provider}
                      disabled={!canWrite}
                      className="block h-8 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-cyan-500 disabled:bg-slate-50"
                    >
                      {providers.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
                    </select>
                    <input
                      name="model"
                      form={`agent-${agent.id}`}
                      defaultValue={agent.model}
                      disabled={!canWrite}
                      className="h-8 w-44 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-cyan-500 disabled:bg-slate-50"
                    />
                  </div>
                ),
              },
              {
                header: "Team",
                cell: (agent) => (
                  <select
                    name="team"
                    form={`agent-${agent.id}`}
                    defaultValue={agent.team}
                    disabled={!canWrite}
                    className="h-9 rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-cyan-500 disabled:bg-slate-50"
                  >
                    {teams.map((team) => <option key={team}>{team}</option>)}
                  </select>
                ),
              },
              {
                header: "Role",
                cell: (agent) => (
                  <input
                    name="role"
                    form={`agent-${agent.id}`}
                    defaultValue={agent.role}
                    disabled={!canWrite}
                    className="h-9 w-44 rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-cyan-500 disabled:bg-slate-50"
                  />
                ),
              },
              {
                header: "Runtime",
                cell: (agent) => (
                  <div className="space-y-2">
                    <StatusBadge value={agent.status} />
                    <p className="text-xs text-slate-500">Project driven</p>
                  </div>
                ),
              },
              {
                header: "Availability",
                cell: (agent) => (
                  <div className="space-y-2">
                    <StatusBadge value={agent.availability} />
                    <select
                      name="availability"
                      form={`agent-${agent.id}`}
                      defaultValue={agent.availability === "Offline" ? "OFFLINE" : "ONLINE"}
                      disabled={!canWrite}
                      className="block h-8 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-cyan-500 disabled:bg-slate-50"
                    >
                      <option value="ONLINE">ONLINE</option>
                      <option value="OFFLINE">OFFLINE</option>
                    </select>
                  </div>
                ),
              },
              {
                header: "System Prompt",
                cell: (agent) => (
                  <textarea
                    name="systemPrompt"
                    form={`agent-${agent.id}`}
                    defaultValue={agent.systemPrompt}
                    disabled={!canWrite}
                    className="min-h-16 w-80 rounded-md border border-slate-200 px-2 py-2 text-sm outline-none focus:border-cyan-500 disabled:bg-slate-50"
                  />
                ),
              },
              {
                header: "User Prompt",
                cell: (agent) => (
                  <textarea
                    name="userPrompt"
                    form={`agent-${agent.id}`}
                    defaultValue={agent.userPrompt}
                    disabled={!canWrite}
                    className="min-h-16 w-80 rounded-md border border-slate-200 px-2 py-2 text-sm outline-none focus:border-cyan-500 disabled:bg-slate-50"
                  />
                ),
              },
              {
                header: "API Key",
                cell: (agent) => (
                  <div className="space-y-2">
                    <StatusBadge value={agent.keyConfigured ? "Configured" : "Pending"} />
                    <input
                      name="apiKey"
                      form={`agent-${agent.id}`}
                      type="password"
                      disabled={!canWrite}
                      placeholder="Replace key"
                      className="block h-8 w-36 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-cyan-500 disabled:bg-slate-50"
                    />
                  </div>
                ),
              },
              { header: "Projects", cell: (agent) => agent.projectIds.length ? agent.projectIds.join(", ") : "Global pool" },
              {
                header: "Actions",
                cell: (agent) => (
                  <ActionButton disabled={!canWrite} form={`agent-${agent.id}`}>
                    Save
                  </ActionButton>
                ),
              },
            ]}
          />
        </TableShell>
      </div>
    </AppShell>
  );
}
