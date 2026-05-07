import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { decryptSecret, encryptSecret, hasEncryptionKey, maskSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export type SetupStatus = {
  initialized: boolean;
  databaseReady: boolean;
  encryptionReady: boolean;
  error?: string;
};

export async function getSetupStatus(): Promise<SetupStatus> {
  if (!process.env.DATABASE_URL) {
    return {
      initialized: false,
      databaseReady: false,
      encryptionReady: hasEncryptionKey(),
      error: "DATABASE_URL is not configured.",
    };
  }

  try {
    const state = await prisma.setupState.findFirst({ orderBy: { createdAt: "asc" } });

    return {
      initialized: Boolean(state?.initialized),
      databaseReady: true,
      encryptionReady: hasEncryptionKey(),
    };
  } catch (error) {
    return {
      initialized: false,
      databaseReady: false,
      encryptionReady: hasEncryptionKey(),
      error: error instanceof Error ? error.message : "Database unavailable",
    };
  }
}

export async function completeSetup(formData: FormData) {
  "use server";

  if (!hasEncryptionKey()) {
    throw new Error("APP_ENCRYPTION_KEY must be configured before completing setup.");
  }

  const existingState = await prisma.setupState.findFirst({ orderBy: { createdAt: "asc" } });

  if (existingState?.initialized) {
    redirect("/settings");
  }

  const bossName = String(formData.get("bossName") ?? "").trim();
  const bossEmail = String(formData.get("bossEmail") ?? "").trim().toLowerCase();
  const bossPassword = String(formData.get("bossPassword") ?? "");
  const localDatabaseUrl = String(formData.get("localDatabaseUrl") ?? "").trim();
  const onlineDatabaseUrl = String(formData.get("onlineDatabaseUrl") ?? "").trim();
  const vercelToken = String(formData.get("vercelToken") ?? "").trim();
  const vercelTeam = String(formData.get("vercelTeam") ?? "").trim();
  const vercelProject = String(formData.get("vercelProject") ?? "").trim();

  if (!bossName || !bossEmail || bossPassword.length < 8) {
    throw new Error("Boss name, email, and an 8+ character password are required.");
  }

  const passwordHash = await hash(bossPassword, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { email: bossEmail },
      update: { name: bossName, passwordHash },
      create: { email: bossEmail, name: bossName, passwordHash },
    });

    const configs = [
      { scope: "LOCAL" as const, key: "MYSQL_DATABASE_URL", value: localDatabaseUrl },
      { scope: "ONLINE" as const, key: "VERCEL_POSTGRES_DATABASE_URL", value: onlineDatabaseUrl },
      { scope: "VERCEL" as const, key: "TOKEN", value: vercelToken },
      { scope: "VERCEL" as const, key: "TEAM", value: vercelTeam },
      { scope: "VERCEL" as const, key: "PROJECT", value: vercelProject },
    ].filter((item) => item.value);

    for (const config of configs) {
      await tx.systemConfig.upsert({
        where: { scope_key: { scope: config.scope, key: config.key } },
        update: { value: encryptSecret(config.value), encrypted: true },
        create: { ...config, value: encryptSecret(config.value), encrypted: true },
      });
    }

    const currentState = await tx.setupState.findFirst({ orderBy: { createdAt: "asc" } });

    if (currentState) {
      await tx.setupState.update({
        where: { id: currentState.id },
        data: { initialized: true, completedAt: new Date() },
      });
    } else {
      await tx.setupState.create({
        data: { initialized: true, completedAt: new Date() },
      });
    }
  });

  redirect("/login");
}

export async function listMaskedConfigs() {
  if (!process.env.DATABASE_URL || !hasEncryptionKey()) {
    return [];
  }

  try {
    const configs = await prisma.systemConfig.findMany({ orderBy: [{ scope: "asc" }, { key: "asc" }] });

    return configs.map((config) => {
      const value = config.encrypted ? decryptSecret(config.value) : config.value;

      return {
        id: config.id,
        scope: config.scope,
        key: config.key,
        value: maskSecret(value),
        encrypted: config.encrypted,
      };
    });
  } catch {
    return [];
  }
}

export async function getBossAccountSummary() {
  if (!process.env.DATABASE_URL) {
    return undefined;
  }

  try {
    const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });

    return user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      : undefined;
  } catch {
    return undefined;
  }
}

export async function updateBossAccount(formData: FormData) {
  "use server";

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to update the Boss account.");
  }

  const bossName = String(formData.get("bossName") ?? "").trim();
  const bossEmail = String(formData.get("bossEmail") ?? "").trim().toLowerCase();
  const bossPassword = String(formData.get("bossPassword") ?? "");
  const existing = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });

  if (!bossName || !bossEmail) {
    throw new Error("Boss name and email are required.");
  }

  if (!existing && bossPassword.length < 8) {
    throw new Error("An 8+ character password is required when creating the first Boss account.");
  }

  const passwordData = bossPassword ? { passwordHash: await hash(bossPassword, 12) } : {};

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        email: bossEmail,
        name: bossName,
        ...passwordData,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        email: bossEmail,
        name: bossName,
        passwordHash: passwordData.passwordHash ?? (await hash(bossPassword, 12)),
      },
    });
  }

  revalidatePath("/settings");
}

export async function updateIntegrationConfigs(formData: FormData) {
  "use server";

  if (!process.env.DATABASE_URL || !hasEncryptionKey()) {
    throw new Error("Database and APP_ENCRYPTION_KEY are required to update integration config.");
  }

  const configs = [
    { scope: "LOCAL" as const, key: "MYSQL_DATABASE_URL", value: String(formData.get("localDatabaseUrl") ?? "").trim() },
    { scope: "ONLINE" as const, key: "VERCEL_POSTGRES_DATABASE_URL", value: String(formData.get("onlineDatabaseUrl") ?? "").trim() },
    { scope: "VERCEL" as const, key: "TOKEN", value: String(formData.get("vercelToken") ?? "").trim() },
    { scope: "VERCEL" as const, key: "TEAM", value: String(formData.get("vercelTeam") ?? "").trim() },
    { scope: "VERCEL" as const, key: "PROJECT", value: String(formData.get("vercelProject") ?? "").trim() },
    { scope: "GITHUB" as const, key: "TOKEN", value: String(formData.get("githubToken") ?? "").trim() },
    { scope: "AI_PROVIDER" as const, key: "GPT_API_KEY", value: String(formData.get("gptApiKey") ?? "").trim() },
    { scope: "AI_PROVIDER" as const, key: "GEMINI_API_KEY", value: String(formData.get("geminiApiKey") ?? "").trim() },
    { scope: "AI_PROVIDER" as const, key: "CLAUDE_API_KEY", value: String(formData.get("claudeApiKey") ?? "").trim() },
    { scope: "AI_PROVIDER" as const, key: "MINIMAX_API_KEY", value: String(formData.get("minimaxApiKey") ?? "").trim() },
  ].filter((config) => config.value);

  if (!configs.length) {
    throw new Error("At least one config value is required.");
  }

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { scope_key: { scope: config.scope, key: config.key } },
      update: { value: encryptSecret(config.value), encrypted: true },
      create: { ...config, value: encryptSecret(config.value), encrypted: true },
    });
  }

  revalidatePath("/settings");
}

export async function testVercelConnection() {
  "use server";

  if (!process.env.DATABASE_URL || !hasEncryptionKey()) {
    throw new Error("Database and APP_ENCRYPTION_KEY are required.");
  }

  const configs = await prisma.systemConfig.findMany({ where: { scope: "VERCEL" } });
  const byKey = new Map(configs.map((config) => [config.key, config.encrypted ? decryptSecret(config.value) : config.value]));
  const token = byKey.get("TOKEN");
  const team = byKey.get("TEAM");
  const project = byKey.get("PROJECT");

  if (!token || !project) {
    throw new Error("Vercel TOKEN and PROJECT must be configured first.");
  }

  const attempts = [
    `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}`,
    team ? `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}?teamId=${encodeURIComponent(team)}` : "",
    team ? `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}?slug=${encodeURIComponent(team)}` : "",
  ].filter(Boolean);

  let ok = false;
  let detail = "Connection failed before request.";

  for (const url of attempts) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    ok = response.ok;
    detail = response.ok ? "Connection OK" : `Connection failed: ${response.status}`;

    if (ok) {
      break;
    }
  }

  await prisma.systemConfig.upsert({
    where: { scope_key: { scope: "VERCEL", key: "LAST_TEST_RESULT" } },
    update: {
      value: encryptSecret(detail),
      encrypted: true,
    },
    create: {
      scope: "VERCEL",
      key: "LAST_TEST_RESULT",
      value: encryptSecret(detail),
      encrypted: true,
    },
  });

  revalidatePath("/settings");
}
