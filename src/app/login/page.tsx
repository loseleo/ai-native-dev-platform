import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/components/login-form";
import { Card, SectionHeader } from "@/components/ui";
import { getPublicShellState } from "@/lib/guards";

export default async function LoginPage() {
  const shell = await getPublicShellState();

  return (
    <AppShell user={shell.user} setupLabel={shell.demoMode ? "Demo mode" : "Login"}>
      <div className="mx-auto max-w-xl space-y-6">
        <SectionHeader title="Boss Login" description="Auth.js Credentials 登录入口。Setup 完成后，Boss 使用首次启动时创建的账号进入平台。" />
        <Card className="p-5">
          <LoginForm />
        </Card>
      </div>
    </AppShell>
  );
}
