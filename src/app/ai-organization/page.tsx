import { AppShell } from "@/components/app-shell";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { requireBossSession } from "@/lib/guards";
import { listAgents } from "@/lib/workspace-repository";

export default async function AiOrganizationPage() {
  const shell = await requireBossSession();
  const agents = await listAgents();
  const teams = ["PM", "RD", "QA", "UI/UX"] as const;

  return (
    <AppShell user={shell.user} setupLabel={shell.demoMode ? "Demo mode" : "Setup complete"}>
      <div className="space-y-6">
        <SectionHeader
          title="AI Organization"
          description="全局组织层管理 Agent、Team、capability 和 lifecycle；项目内只展示参与该项目的 Agent。"
        />
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
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{agent.name}</p>
                          <p className="text-sm text-slate-500">{agent.role}</p>
                        </div>
                        <Badge tone={agent.status === "Working" ? "good" : agent.status === "Blocked" ? "bad" : "neutral"}>
                          {agent.status}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {agent.capabilities.map((capability) => (
                          <span key={capability} className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                            {capability}
                          </span>
                        ))}
                      </div>
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
