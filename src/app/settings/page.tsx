import { AppShell } from "@/components/app-shell";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { requireBossSession } from "@/lib/guards";
import { getSetupStatus, listMaskedConfigs, testVercelConnection } from "@/lib/setup";

export default async function SettingsPage() {
  const shell = await requireBossSession();
  const [status, configs] = await Promise.all([getSetupStatus(), listMaskedConfigs()]);
  const settings = [
    { label: "Boss Account", value: status.initialized ? "Configured" : "Pending", detail: "Auth.js Credentials provider with hashed password.", tone: status.initialized ? ("good" as const) : ("warn" as const) },
    { label: "Local Database", value: status.databaseReady ? "MySQL connected" : "MySQL missing", detail: "Bootstrapped with DATABASE_URL before Setup.", tone: status.databaseReady ? ("good" as const) : ("bad" as const) },
    { label: "Online Database", value: "Vercel Postgres", detail: "Stored as encrypted deployment configuration.", tone: "info" as const },
    { label: "Vercel Integration", value: "Configured in Setup", detail: "Token, team, and project settings support connection tests in the next step.", tone: "warn" as const },
    { label: "Encryption", value: status.encryptionReady ? "APP_ENCRYPTION_KEY ready" : "Key missing", detail: "Required before sensitive configuration can be saved.", tone: status.encryptionReady ? ("good" as const) : ("bad" as const) },
  ];

  return (
    <AppShell user={shell.user} setupLabel={shell.demoMode ? "Demo mode" : "Setup complete"}>
      <div className="space-y-6">
        <SectionHeader title="Settings" description="管理 Boss 账号、Vercel 配置、数据库配置、加密状态和集成测试。" />
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
          <div className="mt-4 grid gap-3">
            {configs.length ? (
              configs.map((config) => (
                <div key={config.id} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-[120px_1fr_180px_100px] md:items-center">
                  <Badge tone="info">{config.scope}</Badge>
                  <p className="text-sm font-semibold text-slate-700">{config.key}</p>
                  <p className="font-mono text-xs text-slate-500">{config.value}</p>
                  <Badge tone={config.encrypted ? "good" : "warn"}>{config.encrypted ? "encrypted" : "plain"}</Badge>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">No saved config yet.</p>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
