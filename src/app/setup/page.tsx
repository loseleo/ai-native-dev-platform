import { AuthShell } from "@/components/auth-shell";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { completeSetup, getSetupStatus } from "@/lib/setup";

export default async function SetupPage() {
  const status = await getSetupStatus();

  return (
    <AuthShell label={status.initialized ? "Initialized" : "First-run Setup"}>
      <div className="space-y-6">
        <SectionHeader
          title="Setup"
          description="首次启动初始化向导的页面骨架。未初始化时会强制进入这里；完成后创建 Boss 登录和加密集成配置。"
        />
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={status.initialized ? "good" : "warn"}>{status.initialized ? "Initialized" : "First-run wizard"}</Badge>
            <Badge tone={status.databaseReady ? "good" : "bad"}>{status.databaseReady ? "Database ready" : "Database missing"}</Badge>
            <Badge tone={status.encryptionReady ? "good" : "bad"}>{status.encryptionReady ? "Encryption ready" : "Encryption key missing"}</Badge>
            <Badge tone="info">Auth.js</Badge>
          </div>
          {!status.databaseReady ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-900">Database bootstrap required</p>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                请先配置本地 MySQL `DATABASE_URL` 并运行 Prisma migration。Setup 页面依赖主库保存 Boss 账号和加密配置。
              </p>
              {status.error ? <p className="mt-2 text-xs text-amber-700">{status.error}</p> : null}
            </div>
          ) : null}
          {!status.encryptionReady ? (
            <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4">
              <p className="font-semibold text-rose-900">APP_ENCRYPTION_KEY is required</p>
              <p className="mt-2 text-sm leading-6 text-rose-800">
                敏感配置会加密保存。请在 `.env.local` 配置 `APP_ENCRYPTION_KEY` 后再提交 Setup。
              </p>
            </div>
          ) : null}
          {status.initialized ? (
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-900">Setup already completed</p>
              <p className="mt-2 text-sm leading-6 text-emerald-800">首次初始化已经完成。后续请到 Settings 更新集成配置。</p>
            </div>
          ) : null}
          <form action={completeSetup} className="mt-6 grid gap-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="bossName">
                  Boss Name
                </label>
                <input id="bossName" name="bossName" className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Boss" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="bossEmail">
                  Boss Email
                </label>
                <input id="bossEmail" name="bossEmail" type="email" className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="boss@example.com" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="bossPassword">
                  Boss Password
                </label>
                <input id="bossPassword" name="bossPassword" type="password" className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="8+ characters" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="localDatabaseUrl">
                  Local MySQL DATABASE_URL
                </label>
                <textarea id="localDatabaseUrl" name="localDatabaseUrl" className="mt-2 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="mysql://user:password@localhost:3306/ai_native_dev" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="onlineDatabaseUrl">
                  Vercel Postgres DATABASE_URL
                </label>
                <textarea id="onlineDatabaseUrl" name="onlineDatabaseUrl" className="mt-2 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="postgres://..." />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="vercelToken">
                  Vercel Token
                </label>
                <input id="vercelToken" name="vercelToken" type="password" className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="Encrypted at rest" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="vercelTeam">
                  Vercel Team
                </label>
                <input id="vercelTeam" name="vercelTeam" className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="team slug or id" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="vercelProject">
                  Vercel Project
                </label>
                <input id="vercelProject" name="vercelProject" className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500" placeholder="project id/name" />
              </div>
            </div>
            <button
              className="h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={!status.databaseReady || !status.encryptionReady || status.initialized}
              type="submit"
            >
              Complete setup and create Boss
            </button>
          </form>
        </Card>
      </div>
    </AuthShell>
  );
}
