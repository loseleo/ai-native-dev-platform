import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { Card, SectionHeader } from "@/components/ui";
import { getSetupStatus } from "@/lib/setup";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const setup = await getSetupStatus();

  if (setup.databaseReady && !setup.initialized) {
    redirect("/setup");
  }

  return (
    <AuthShell label="Boss Login">
      <div className="mx-auto max-w-xl space-y-6">
        <SectionHeader title="Boss Login" description="Auth.js Credentials 登录入口。Setup 完成后，Boss 使用首次启动时创建的账号进入平台。" />
        <Card className="p-5">
          <LoginForm />
        </Card>
      </div>
    </AuthShell>
  );
}
