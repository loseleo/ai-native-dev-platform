import { AppShell } from "@/components/app-shell";
import { CreateDialog } from "@/components/create-dialog";
import { Badge, Card, DataTable, SectionHeader, StatusBadge, TableShell } from "@/components/ui";
import { requireBossSession } from "@/lib/guards";
import {
  getBossAccountSummary,
  getSetupStatus,
  listMaskedConfigs,
  testVercelConnection,
  updateBossAccount,
  updateIntegrationConfigs,
} from "@/lib/setup";
import { listProjects } from "@/lib/workspace-repository";

export default async function SettingsPage() {
  const shell = await requireBossSession();
  const [status, configs, projects, boss] = await Promise.all([getSetupStatus(), listMaskedConfigs(), listProjects(), getBossAccountSummary()]);
  const canWrite = status.databaseReady && status.encryptionReady && !shell.demoMode;
  const settings = [
    { label: "Boss Account", value: status.initialized ? "Configured" : "Pending", detail: "Auth.js Credentials provider with hashed password.", tone: status.initialized ? ("good" as const) : ("warn" as const) },
    { label: "Local Database", value: status.databaseReady ? "MySQL connected" : "MySQL missing", detail: "Bootstrapped with DATABASE_URL before Setup.", tone: status.databaseReady ? ("good" as const) : ("bad" as const) },
    { label: "Online Database", value: "Vercel Postgres", detail: "Stored as encrypted deployment configuration.", tone: "info" as const },
    { label: "Vercel Integration", value: "Configured in Setup", detail: "Token, team, and project settings support connection tests in the next step.", tone: "warn" as const },
    { label: "Encryption", value: status.encryptionReady ? "APP_ENCRYPTION_KEY ready" : "Key missing", detail: "Required before sensitive configuration can be saved.", tone: status.encryptionReady ? ("good" as const) : ("bad" as const) },
  ];

  return (
    <AppShell user={shell.user} setupLabel={shell.demoMode ? "Demo mode" : "Setup complete"} projects={projects}>
      <div className="space-y-6">
        <SectionHeader title="Settings" description="管理 Boss 账号、Vercel 配置、数据库配置、加密状态和集成测试。" />
        <div className="flex flex-wrap justify-end gap-3">
          <CreateDialog title="Update Boss Account" description="更新 Boss 名称、邮箱；密码留空则保持不变。" trigger="Update Boss" disabled={!status.databaseReady}>
            <form action={updateBossAccount} className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="bossName">Boss Name</label>
                <input id="bossName" name="bossName" defaultValue={boss?.name ?? ""} className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Boss" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="bossEmail">Boss Email</label>
                <input id="bossEmail" name="bossEmail" defaultValue={boss?.email ?? ""} type="email" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="boss@example.com" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="bossPassword">New Password</label>
                <input id="bossPassword" name="bossPassword" type="password" className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Leave blank to keep" />
              </div>
              <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 md:col-span-3" type="submit">
                Save Boss Account
              </button>
            </form>
          </CreateDialog>
          <CreateDialog title="Update Integration Config" description="只填写需要更新的字段；保存后继续 masked 展示。" trigger="Update Config" disabled={!canWrite}>
            <form action={updateIntegrationConfigs} className="grid gap-4 md:grid-cols-2">
              <textarea name="localDatabaseUrl" className="min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="Local MySQL DATABASE_URL" />
              <textarea name="onlineDatabaseUrl" className="min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="Vercel Postgres DATABASE_URL" />
              <input name="vercelToken" type="password" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Vercel token" />
              <input name="vercelTeam" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Vercel team slug or id" />
              <input name="vercelProject" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500 md:col-span-2" placeholder="Vercel project id/name" />
              <input name="gptApiKey" type="password" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Global GPT API key" />
              <input name="geminiApiKey" type="password" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Global Gemini API key" />
              <input name="claudeApiKey" type="password" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Global Claude API key" />
              <input name="minimaxApiKey" type="password" className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Global Minimax API key" />
              <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 md:col-span-2" type="submit">
                Save Config
              </button>
            </form>
          </CreateDialog>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {settings.map((item) => (
            <Card key={item.label} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{item.value}</p>
                </div>
                <Badge tone={item.tone}>{item.tone}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Encrypted Integration Config</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">敏感字段只展示 masked value。真实值通过 Setup 或后续配置表单加密保存。</p>
            </div>
            <form action={testVercelConnection}>
              <button
                disabled={!status.databaseReady || !status.encryptionReady}
                className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                type="submit"
              >
                Test Vercel
              </button>
            </form>
          </div>
        </Card>
        <TableShell title="Masked Config Values">
          <DataTable
            rows={configs}
            getKey={(config) => config.id}
            columns={[
              { header: "Scope", cell: (config) => <Badge tone="info">{config.scope}</Badge> },
              { header: "Key", cell: (config) => <span className="font-semibold text-slate-800">{config.key}</span> },
              { header: "Value", cell: (config) => <span className="font-mono text-xs text-slate-500">{config.value}</span> },
              { header: "Encryption", cell: (config) => <StatusBadge value={config.encrypted ? "Encrypted" : "Plain"} /> },
            ]}
          />
        </TableShell>
      </div>
    </AppShell>
  );
}
