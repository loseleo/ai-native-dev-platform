import { AppShell } from "@/components/app-shell";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { requireBossSession } from "@/lib/guards";
import { getSetupStatus } from "@/lib/setup";
import { createGlobalAgent, updateGlobalAgent } from "@/lib/workspace-actions";
import { listAgents } from "@/lib/workspace-repository";

export default async function AiOrganizationPage() {
  const shell = await requireBossSession();
  const [agents, setup] = await Promise.all([listAgents(), getSetupStatus()]);
  const teams = ["PM", "RD", "QA", "UI/UX"] as const;
  const statuses = ["IDLE", "WORKING", "PAUSED", "BLOCKED", "UPGRADING"] as const;
  const statusValue = {
    Idle: "IDLE",
    Working: "WORKING",
    Paused: "PAUSED",
    Blocked: "BLOCKED",
    Upgrading: "UPGRADING",
  } as const;

  return (
    <AppShell user={shell.user} setupLabel={shell.demoMode ? "Demo mode" : "Setup complete"}>
      <div className="space-y-6">
        <SectionHeader
          title="AI Organization"
          description="全局组织层管理 Agent、Team、capability 和 lifecycle；项目内只展示参与该项目的 Agent。"
        />
        <Card className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Create Global Agent</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                全局 Agent 可先创建在组织池中，之后在具体 Project Workspace 里加入项目。
              </p>
            </div>
            {!setup.databaseReady ? <Badge tone="warn">Demo seed is read-only</Badge> : null}
          </div>
          <form action={createGlobalAgent} className="mt-4 grid gap-3 xl:grid-cols-[160px_120px_160px_1fr_140px_auto] xl:items-end">
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
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="capabilities">Capabilities</label>
              <input id="capabilities" name="capabilities" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Next.js, Code Review, QA" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="status">Status</label>
              <select id="status" name="status" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500">
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            <button
              disabled={!setup.databaseReady}
              className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              type="submit"
            >
              Add Agent
            </button>
          </form>
          {!setup.databaseReady ? <p className="mt-3 text-sm text-amber-700">当前没有 `DATABASE_URL`，全局组织页会显示 demo seed，但新增/编辑会禁用。</p> : null}
        </Card>
        <div className="grid gap-5 xl:grid-cols-4">
          {teams.map((team) => (
            <Card key={team} className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-950">{team} Team</h2>
                <Badge tone="info">{agents.filter((agent) => agent.team === team).length}</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {agents
                  .filter((agent) => agent.team === team)
                  .map((agent) => (
                    <div key={agent.id} className="rounded-md border border-slate-200 p-3">
                      <form action={updateGlobalAgent} className="space-y-3">
                        <input name="agentId" type="hidden" value={agent.id} />
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <label className="text-xs font-semibold uppercase text-slate-400" htmlFor={`name-${agent.id}`}>Name</label>
                            <input
                              id={`name-${agent.id}`}
                              name="name"
                              defaultValue={agent.name}
                              className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-500"
                            />
                          </div>
                          <Badge tone={agent.status === "Working" ? "good" : agent.status === "Blocked" ? "bad" : "neutral"}>
                            {agent.status}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase text-slate-400" htmlFor={`role-${agent.id}`}>Role</label>
                          <input
                            id={`role-${agent.id}`}
                            name="role"
                            defaultValue={agent.role}
                            className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-700 outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-semibold uppercase text-slate-400" htmlFor={`team-${agent.id}`}>Team</label>
                            <select
                              id={`team-${agent.id}`}
                              name="team"
                              defaultValue={agent.team}
                              className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-700 outline-none focus:border-cyan-500"
                            >
                              {teams.map((option) => <option key={option}>{option}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase text-slate-400" htmlFor={`status-${agent.id}`}>Status</label>
                            <select
                              id={`status-${agent.id}`}
                              name="status"
                              defaultValue={statusValue[agent.status]}
                              className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-700 outline-none focus:border-cyan-500"
                            >
                              {statuses.map((status) => <option key={status}>{status}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase text-slate-400" htmlFor={`capabilities-${agent.id}`}>Capabilities</label>
                          <textarea
                            id={`capabilities-${agent.id}`}
                            name="capabilities"
                            defaultValue={agent.capabilities.join("\n")}
                            className="mt-1 min-h-20 w-full rounded-md border border-slate-200 px-2 py-2 text-sm text-slate-700 outline-none focus:border-cyan-500"
                          />
                        </div>
                        <button
                          disabled={!setup.databaseReady}
                          className="h-9 w-full rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          type="submit"
                        >
                          Save Changes
                        </button>
                      </form>
                    </div>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
