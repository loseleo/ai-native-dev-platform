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
  const statuses = ["IDLE", "WORKING", "PAUSED", "BLOCKED", "UPGRADING"] as const;
  const statusValue = {
    Idle: "IDLE",
    Working: "WORKING",
    Paused: "PAUSED",
    Blocked: "BLOCKED",
    Upgrading: "UPGRADING",
  } as const;

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
            description="全局 Agent 先进入组织池，具体项目成员关系在 Project Workspace / Agents 管理。"
            trigger="Add Agent"
            disabled={!canWrite}
          >
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
              disabled={!canWrite}
              className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              type="submit"
            >
              Add Agent
            </button>
          </form>
          </CreateDialog>
        </div>
        <TableShell title="Global Agent Pool" description="Agent inventory across PM/RD/QA/UIUX, with project membership shown as references.">
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
                header: "Status",
                cell: (agent) => (
                  <div className="space-y-2">
                    <StatusBadge value={agent.status} />
                    <select
                      name="status"
                      form={`agent-${agent.id}`}
                      defaultValue={statusValue[agent.status]}
                      disabled={!canWrite}
                      className="block h-8 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-cyan-500 disabled:bg-slate-50"
                    >
                      {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </div>
                ),
              },
              {
                header: "Capabilities",
                cell: (agent) => (
                  <textarea
                    name="capabilities"
                    form={`agent-${agent.id}`}
                    defaultValue={agent.capabilities.join("\n")}
                    disabled={!canWrite}
                    className="min-h-16 w-72 rounded-md border border-slate-200 px-2 py-2 text-sm outline-none focus:border-cyan-500 disabled:bg-slate-50"
                  />
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
