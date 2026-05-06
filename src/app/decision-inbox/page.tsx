import { AppShell } from "@/components/app-shell";
import { DecisionCard } from "@/components/lists";
import { SectionHeader } from "@/components/ui";
import { requireBossSession } from "@/lib/guards";
import { listBossDecisions } from "@/lib/workspace-repository";

export default async function DecisionInboxPage() {
  const shell = await requireBossSession();
  const bossQueue = await listBossDecisions();

  return (
    <AppShell user={shell.user} setupLabel={shell.demoMode ? "Demo mode" : "Setup complete"}>
      <div className="space-y-6">
        <SectionHeader
          title="Decision Inbox"
          description="全局 Inbox 只聚合 Boss 待处理或阻塞决策。点击决策后回到对应 Project Workspace 的 Decisions 模块处理上下文。"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {bossQueue.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
