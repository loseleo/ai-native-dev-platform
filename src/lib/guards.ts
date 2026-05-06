import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { getSetupStatus } from "@/lib/setup";

export async function requireBossSession() {
  const setup = await getSetupStatus();

  if (setup.databaseReady && !setup.initialized) {
    redirect("/setup");
  }

  if (!setup.databaseReady) {
    return {
      user: undefined,
      setup,
      demoMode: true,
    };
  }

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return {
    user: session.user,
    setup,
    demoMode: false,
  };
}

export async function getPublicShellState() {
  const setup = await getSetupStatus();
  const session = setup.databaseReady ? await getServerSession(authOptions) : null;

  return {
    user: session?.user,
    setup,
    demoMode: !setup.databaseReady,
  };
}
