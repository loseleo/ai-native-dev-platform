"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildCodePatchSummary, generateStructured } from "@/lib/ai-delivery";
import { decryptSecret, encryptSecret, hasEncryptionKey } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { decisionStatusToDb, stageToDb, taskStatusToDb } from "@/lib/workspace-repository";
import type { DecisionStatus, ProjectStage, TaskStatus } from "@/lib/data";

function requireDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for write operations.");
  }
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function encryptedOptional(value: string) {
  if (!value) {
    return null;
  }

  if (!hasEncryptionKey()) {
    throw new Error("APP_ENCRYPTION_KEY is required before saving database URLs or agent API keys.");
  }

  return encryptSecret(value);
}

const supportedAgentProviders = ["gpt", "gemini", "minimax", "claude"] as const;
type SupportedAgentProvider = (typeof supportedAgentProviders)[number];

const defaultModels: Record<SupportedAgentProvider, string> = {
  gpt: "gpt-5.4",
  gemini: "gemini-2.5-pro",
  minimax: "minimax-m1",
  claude: "claude-sonnet-4.5",
};

function agentProvider(formData: FormData) {
  const provider = text(formData, "provider").toLowerCase();

  if (supportedAgentProviders.includes(provider as SupportedAgentProvider)) {
    return provider as SupportedAgentProvider;
  }

  return "gpt";
}

function agentModel(formData: FormData, provider: SupportedAgentProvider) {
  return text(formData, "model") || defaultModels[provider];
}

function parseGitRepository(value: string) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim().replace(/\.git$/, "");
  const sshMatch = trimmed.match(/^git@github\.com:([^/]+\/[^/]+)$/i);

  if (sshMatch?.[1]) {
    return sshMatch[1];
  }

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);

    if (url.hostname.endsWith("github.com") && parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
  } catch {
    // Plain owner/repo values are valid and handled below.
  }

  return trimmed;
}

function parseVercelProjectUrl(value: string) {
  if (!value) {
    return { team: "", project: "" };
  }

  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);

    if (url.hostname === "vercel.com" && parts.length >= 2) {
      return {
        team: parts[0] ?? "",
        project: parts[1] ?? "",
      };
    }
  } catch {
    // Manual team/project fields remain the source of truth if URL parsing fails.
  }

  return { team: "", project: "" };
}

function parsePreviewUrl(value: string) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);

    if (url.hostname.endsWith(".vercel.app")) {
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    return "";
  }

  return "";
}

function revalidateWorkspace(projectId: string, module?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/decision-inbox");
  revalidatePath(`/projects/${projectId}`);

  if (module) {
    revalidatePath(`/projects/${projectId}/${module}`);
  }
}

async function pickProjectAgent(projectId: string, team: string) {
  const membership = await prisma.projectAgent.findFirst({
    where: { projectId, agent: { team } },
    include: { agent: true },
  });

  return membership?.agent ?? null;
}

async function getProviderApiKey(agent: { apiKey: string | null; provider: string } | null) {
  if (agent?.apiKey) {
    return agent.apiKey;
  }

  const provider = agent?.provider?.toUpperCase() || "GPT";
  const config = await prisma.systemConfig.findUnique({
    where: { scope_key: { scope: "AI_PROVIDER", key: `${provider}_API_KEY` } },
  });

  return config?.value ?? null;
}

async function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  const config = await prisma.systemConfig.findUnique({
    where: { scope_key: { scope: "GITHUB", key: "TOKEN" } },
  });

  if (!config?.value) {
    return null;
  }

  return config.encrypted ? decryptSecret(config.value) : config.value;
}

async function getVercelConfig(project: { vercelTeam: string | null; vercelProject: string | null }) {
  const configs = await prisma.systemConfig.findMany({ where: { scope: "VERCEL" } });
  const byKey = new Map(configs.map((config) => [config.key, config.encrypted ? decryptSecret(config.value) : config.value]));

  return {
    token: byKey.get("TOKEN") ?? "",
    team: project.vercelTeam || byKey.get("TEAM") || "",
    project: project.vercelProject || byKey.get("PROJECT") || "",
  };
}

async function readLatestVercelDeployment(project: { vercelTeam: string | null; vercelProject: string | null }, fallbackUrl: string) {
  const config = await getVercelConfig(project);

  if (!config.token || !config.project) {
    return {
      status: "READY" as const,
      url: fallbackUrl,
      buildStatus: "Manual sync",
      logsUrl: config.team && config.project ? `https://vercel.com/${config.team}/${config.project}` : "",
      vercelDeploymentId: "",
    };
  }

  const params = new URLSearchParams({ projectId: config.project, limit: "1" });

  if (config.team) {
    params.set("teamId", config.team);
  }

  const response = await fetch(`https://api.vercel.com/v13/deployments?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      status: "READY" as const,
      url: fallbackUrl,
      buildStatus: `Manual sync; Vercel API ${response.status}`,
      logsUrl: config.team && config.project ? `https://vercel.com/${config.team}/${config.project}` : "",
      vercelDeploymentId: "",
    };
  }

  const body = await response.json() as {
    deployments?: Array<{ uid?: string; url?: string; state?: string; inspectorUrl?: string }>;
  };
  const deployment = body.deployments?.[0];
  const state = deployment?.state ?? "READY";

  return {
    status: state === "ERROR" || state === "FAILED" ? ("FAILED" as const) : state === "BUILDING" || state === "QUEUED" ? ("BUILDING" as const) : ("READY" as const),
    url: deployment?.url ? `https://${deployment.url}` : fallbackUrl,
    buildStatus: state,
    logsUrl: deployment?.inspectorUrl || (config.team && config.project ? `https://vercel.com/${config.team}/${config.project}` : ""),
    vercelDeploymentId: deployment?.uid ?? "",
  };
}

async function createGitHubPrPackage({
  baseBranch,
  branch,
  repo,
  title,
  body,
  token,
}: {
  baseBranch: string;
  branch: string;
  repo: string;
  title: string;
  body: string;
  token: string;
}) {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const apiBase = `https://api.github.com/repos/${repo}`;
  const refResponse = await fetch(`${apiBase}/git/ref/heads/${encodeURIComponent(baseBranch)}`, { headers, cache: "no-store" });

  if (!refResponse.ok) {
    throw new Error(`GitHub base branch lookup failed: ${refResponse.status}`);
  }

  const ref = await refResponse.json() as { object?: { sha?: string } };
  const sha = ref.object?.sha;

  if (!sha) {
    throw new Error("GitHub base branch SHA is missing.");
  }

  const createRefResponse = await fetch(`${apiBase}/git/refs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
    cache: "no-store",
  });

  if (!createRefResponse.ok && createRefResponse.status !== 422) {
    throw new Error(`GitHub branch creation failed: ${createRefResponse.status}`);
  }

  const path = `ai-delivery/${branch.replaceAll("/", "-")}.md`;
  const contentResponse = await fetch(`${apiBase}/contents/${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `Add AI delivery package for ${title}`,
      content: Buffer.from(body).toString("base64"),
      branch,
    }),
    cache: "no-store",
  });

  if (!contentResponse.ok) {
    throw new Error(`GitHub delivery package commit failed: ${contentResponse.status}`);
  }

  const content = await contentResponse.json() as { commit?: { sha?: string } };
  const pullResponse = await fetch(`${apiBase}/pulls`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title,
      head: branch,
      base: baseBranch,
      body,
      draft: true,
    }),
    cache: "no-store",
  });

  if (!pullResponse.ok && pullResponse.status !== 422) {
    throw new Error(`GitHub PR creation failed: ${pullResponse.status}`);
  }

  if (pullResponse.status === 422) {
    return {
      commitSha: content.commit?.sha ?? "",
      prUrl: `https://github.com/${repo}/pulls`,
    };
  }

  const pull = await pullResponse.json() as { html_url?: string };

  return {
    commitSha: content.commit?.sha ?? "",
    prUrl: pull.html_url ?? `https://github.com/${repo}/pulls`,
  };
}

async function createBlockingDecision(projectId: string, title: string, detail: string) {
  await prisma.decision.create({
    data: {
      projectId,
      title,
      raisedBy: "System",
      owner: "Boss",
      type: "Execution block",
      status: "PENDING",
      blocking: true,
      recommendation: detail,
      impact: "AI delivery cannot continue until this setup issue is resolved.",
    },
  });
}

export async function createRequirementFromPrompt(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const title = text(formData, "title");
  const prompt = text(formData, "prompt");
  const targetUsers = text(formData, "targetUsers") || "Web users";
  const scope = text(formData, "scope") || "MVP web delivery";
  const acceptance = text(formData, "acceptance") || "Core workflow works end to end.";
  const techPreference = text(formData, "techPreference") || "Next.js + Tailwind CSS + TypeScript";

  if (!projectId || !title || !prompt) {
    throw new Error("Project, requirement title, and prompt are required.");
  }

  const agent = await pickProjectAgent(projectId, "PM");

  await prisma.$transaction(async (tx) => {
    const requirement = await tx.requirement.create({
      data: {
        projectId,
        title,
        prompt,
        targetUsers,
        scope,
        acceptance,
        techPreference,
        status: "DRAFT",
      },
    });

    const run = await tx.agentRun.create({
      data: {
        projectId,
        requirementId: requirement.id,
        agentId: agent?.id,
        type: "PLAN",
        status: "QUEUED",
        provider: agent?.provider ?? "gpt",
        model: agent?.model ?? "gpt-5.4",
        input: prompt,
      },
    });

    await tx.agentRunStep.create({
      data: {
        runId: run.id,
        name: "Requirement captured",
        status: "COMPLETED",
        detail: "Boss submitted a web requirement and queued AI planning.",
      },
    });

    await tx.ledgerEvent.create({
      data: {
        projectId,
        title: "Requirement created",
        detail: `${title} queued for AI delivery planning.`,
        objectType: "Requirement",
        objectId: requirement.id,
      },
    });
  });

  revalidateWorkspace(projectId, "requirements");
  revalidateWorkspace(projectId, "activity");
  redirect(`/projects/${projectId}/requirements`);
}

export async function planRequirementWithAI(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const requirementId = text(formData, "requirementId");

  const requirement = await prisma.requirement.findUnique({ where: { id: requirementId } });

  if (!projectId || !requirement || requirement.projectId !== projectId) {
    throw new Error("Requirement not found for this project.");
  }

  const agent = await pickProjectAgent(projectId, "PM");
  const run = await prisma.agentRun.create({
    data: {
      projectId,
      requirementId,
      agentId: agent?.id,
      type: "PLAN",
      status: "RUNNING",
      provider: agent?.provider ?? "gpt",
      model: agent?.model ?? "gpt-5.4",
      input: requirement.prompt,
    },
  });

  try {
    if (!agent) {
      throw new Error("No PM Agent assigned to this project.");
    }

    const apiKey = await getProviderApiKey(agent);

    if (!apiKey) {
      throw new Error("No PM Agent or global provider API key configured.");
    }

    await prisma.agentRunStep.create({
      data: { runId: run.id, name: "AI planning", status: "RUNNING", detail: "Generating PRD, tasks, technical plan, code plan, and QA checklist." },
    });

    const plan = await generateStructured({
      provider: agent.provider,
      model: agent.model,
      apiKey,
      system: "You are an AI PM/RD/QA delivery team for a Web project.",
      prompt: [requirement.title, requirement.prompt, requirement.scope, requirement.acceptance, requirement.techPreference].join("\n"),
      schema: "Return PRD, tasks, technical plan, code plan, QA checklist, deployment summary.",
    });
    const change = buildCodePatchSummary(requirement.title, plan.codePlan);

    await prisma.$transaction([
      prisma.requirement.update({ where: { id: requirementId }, data: { status: "PLANNED" } }),
      prisma.agentRun.update({ where: { id: run.id }, data: { status: "WAITING_APPROVAL", output: JSON.stringify(plan, null, 2) } }),
      prisma.agentRunStep.create({
        data: {
          runId: run.id,
          name: "Delivery plan generated",
          status: "COMPLETED",
          detail: "AI generated PRD, tasks, technical plan, code plan, and QA checklist.",
          output: JSON.stringify(plan, null, 2),
        },
      }),
      ...plan.tasks.map((task) =>
        prisma.task.create({
          data: {
            projectId,
            title: task.title,
            type: task.team === "QA" ? "Testing" : task.team === "PM" ? "PRD" : "Development",
            stage: task.team === "QA" ? "QA_CASE_REVIEW" : task.team === "PM" ? "PRD_REVIEW" : "DEVELOPMENT",
            team: task.team,
            owner: task.owner,
            reviewer: "Boss",
            status: "TODO",
            priority: task.priority as never,
            deliverable: task.deliverable,
            acceptance: task.acceptance,
          },
        }),
      ),
      prisma.knowledgeDocument.upsert({
        where: { projectId_filename: { projectId, filename: `requirements-${requirementId}.md` } },
        update: { title: `${requirement.title} PRD`, summary: plan.prd, content: JSON.stringify(plan, null, 2) },
        create: { projectId, filename: `requirements-${requirementId}.md`, title: `${requirement.title} PRD`, summary: plan.prd, content: JSON.stringify(plan, null, 2) },
      }),
      prisma.artifact.create({ data: { projectId, name: `${requirement.title} PRD`, type: "PRD", owner: agent.name, status: "DRAFT" } }),
      prisma.artifact.create({ data: { projectId, name: `${requirement.title} QA checklist`, type: "QA Report", owner: "Iris", status: "DRAFT" } }),
      prisma.codeChange.create({
        data: {
          projectId,
          requirementId,
          runId: run.id,
          branch: change.branch,
          summary: change.summary,
          status: "PLANNED",
        },
      }),
      prisma.decision.create({
        data: {
          projectId,
          title: `Approve AI delivery plan: ${requirement.title}`,
          raisedBy: agent.name,
          owner: "Boss",
          type: "AI delivery approval",
          status: "PENDING",
          blocking: true,
          recommendation: "Approve the generated PRD, task breakdown, technical plan, code plan, and QA checklist before code generation.",
          impact: "Code generation and GitHub PR creation remain blocked until approved.",
        },
      }),
      prisma.ledgerEvent.create({
        data: {
          projectId,
          title: "AI delivery plan generated",
          detail: `${agent.name} generated plan for ${requirement.title}; waiting for Boss approval.`,
          objectType: "AgentRun",
          objectId: run.id,
        },
      }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI planning failed.";

    await prisma.$transaction([
      prisma.requirement.update({ where: { id: requirementId }, data: { status: "BLOCKED" } }),
      prisma.agentRun.update({ where: { id: run.id }, data: { status: "BLOCKED", error: message } }),
      prisma.agentRunStep.create({ data: { runId: run.id, name: "AI planning blocked", status: "BLOCKED", detail: message, error: message } }),
      prisma.ledgerEvent.create({ data: { projectId, title: "AI delivery blocked", detail: message, objectType: "AgentRun", objectId: run.id } }),
    ]);
    await createBlockingDecision(projectId, `Configure PM Agent key for ${requirement.title}`, message);
  }

  revalidateWorkspace(projectId, "requirements");
  revalidateWorkspace(projectId, "activity");
  revalidateWorkspace(projectId, "tasks");
  revalidateWorkspace(projectId, "knowledge");
  revalidateWorkspace(projectId, "artifacts");
  revalidateWorkspace(projectId, "decisions");
}

export async function approveRunPlan(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const requirementId = text(formData, "requirementId");
  const run = await prisma.agentRun.findFirst({
    where: { projectId, requirementId, type: "PLAN" },
    orderBy: { updatedAt: "desc" },
  });

  await prisma.$transaction([
    prisma.requirement.update({ where: { id: requirementId }, data: { status: "APPROVED" } }),
    ...(run
      ? [
          prisma.agentRun.update({ where: { id: run.id }, data: { status: "COMPLETED" } }),
          prisma.agentRunStep.create({
            data: {
              runId: run.id,
              name: "Boss approved plan",
              status: "COMPLETED",
              detail: "Boss approved the AI delivery plan; code generation is now allowed.",
            },
          }),
        ]
      : []),
    prisma.codeChange.updateMany({ where: { projectId, requirementId }, data: { status: "APPROVED" } }),
    prisma.decision.updateMany({
      where: { projectId, title: { contains: `Approve AI delivery plan` }, status: "PENDING" },
      data: { status: "APPROVED", blocking: false },
    }),
    prisma.ledgerEvent.create({
      data: { projectId, title: "AI delivery plan approved", detail: `${requirementId} approved for code generation.`, objectType: "Requirement", objectId: requirementId },
    }),
  ]);

  revalidateWorkspace(projectId, "requirements");
  revalidateWorkspace(projectId, "decisions");
  revalidateWorkspace(projectId, "activity");
}

export async function generateCodePatch(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const requirementId = text(formData, "requirementId");
  const requirement = await prisma.requirement.findUnique({ where: { id: requirementId } });

  if (!requirement || requirement.status !== "APPROVED") {
    throw new Error("Boss must approve the delivery plan before code generation.");
  }

  const agent = await pickProjectAgent(projectId, "RD");
  const run = await prisma.agentRun.create({
    data: {
      projectId,
      requirementId,
      agentId: agent?.id,
      type: "CODE",
      status: "RUNNING",
      provider: agent?.provider ?? "gpt",
      model: agent?.model ?? "gpt-5.4",
      input: requirement.prompt,
    },
  });

  try {
    if (!agent) {
      throw new Error("No RD Agent assigned to this project.");
    }

    const apiKey = await getProviderApiKey(agent);

    if (!apiKey) {
      throw new Error("No RD Agent or global provider API key configured.");
    }

    const plan = await generateStructured({
      provider: agent.provider,
      model: agent.model,
      apiKey,
      system: "You are an AI RD Agent producing a reviewed code patch plan for a Next.js app.",
      prompt: `${requirement.title}\n${requirement.prompt}\n${requirement.acceptance}`,
      schema: "Return code plan and implementation summary.",
    });
    const change = buildCodePatchSummary(requirement.title, plan.codePlan);

    await prisma.$transaction([
      prisma.requirement.update({ where: { id: requirementId }, data: { status: "CODE_READY" } }),
      prisma.agentRun.update({ where: { id: run.id }, data: { status: "WAITING_APPROVAL", output: change.summary } }),
      prisma.agentRunStep.create({ data: { runId: run.id, name: "Code patch generated", status: "COMPLETED", detail: "AI generated code change plan for Boss approval.", output: change.summary } }),
      prisma.codeChange.updateMany({ where: { projectId, requirementId }, data: { runId: run.id, branch: change.branch, summary: change.summary, status: "GENERATED" } }),
      prisma.artifact.create({ data: { projectId, name: `${requirement.title} code patch plan`, type: "Code Note", owner: agent.name, status: "DRAFT" } }),
      prisma.decision.create({
        data: {
          projectId,
          title: `Approve GitHub PR creation: ${requirement.title}`,
          raisedBy: agent.name,
          owner: "Boss",
          type: "Code write approval",
          status: "PENDING",
          blocking: true,
          recommendation: `Approve creating a GitHub delivery branch ${change.branch} and PR from the generated patch plan.`,
          impact: "No repository write happens before this approval.",
        },
      }),
      prisma.ledgerEvent.create({ data: { projectId, title: "AI code patch generated", detail: `${agent.name} generated a code patch plan for ${requirement.title}.`, objectType: "AgentRun", objectId: run.id } }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Code generation failed.";
    await prisma.$transaction([
      prisma.requirement.update({ where: { id: requirementId }, data: { status: "BLOCKED" } }),
      prisma.agentRun.update({ where: { id: run.id }, data: { status: "BLOCKED", error: message } }),
      prisma.agentRunStep.create({ data: { runId: run.id, name: "Code generation blocked", status: "BLOCKED", detail: message, error: message } }),
      prisma.ledgerEvent.create({ data: { projectId, title: "Code generation blocked", detail: message, objectType: "AgentRun", objectId: run.id } }),
    ]);
    await createBlockingDecision(projectId, `Configure RD Agent key for ${requirement.title}`, message);
  }

  revalidateWorkspace(projectId, "requirements");
  revalidateWorkspace(projectId, "activity");
  revalidateWorkspace(projectId, "artifacts");
  revalidateWorkspace(projectId, "decisions");
}

export async function approveAndCreatePullRequest(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const requirementId = text(formData, "requirementId");
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  const requirement = await prisma.requirement.findUnique({ where: { id: requirementId } });
  const change = await prisma.codeChange.findFirst({ where: { projectId, requirementId }, orderBy: { updatedAt: "desc" } });

  if (!project || !requirement || !change) {
    throw new Error("Project, requirement, and code change are required.");
  }

  const token = await getGitHubToken();
  const run = await prisma.agentRun.create({
    data: {
      projectId,
      requirementId,
      type: "PR",
      status: "RUNNING",
      provider: "github",
      model: "pull-request-api",
      input: change.summary,
    },
  });

  if (!project.repo || !token) {
    const detail = !project.repo ? "Project repository is not configured." : "GitHub token is not configured for protected PR package creation.";
    await prisma.$transaction([
      prisma.agentRun.update({ where: { id: run.id }, data: { status: "BLOCKED", error: detail } }),
      prisma.agentRunStep.create({ data: { runId: run.id, name: "GitHub PR blocked", status: "BLOCKED", detail, error: detail } }),
      prisma.codeChange.update({ where: { id: change.id }, data: { status: "BLOCKED" } }),
      prisma.ledgerEvent.create({ data: { projectId, title: "GitHub PR creation blocked", detail, objectType: "CodeChange", objectId: change.id } }),
    ]);
    await createBlockingDecision(projectId, `GitHub PR blocked: ${project.name}`, detail);
  } else {
    try {
      await prisma.agentRunStep.create({
        data: { runId: run.id, name: "GitHub package write", status: "RUNNING", detail: `Creating delivery package branch ${change.branch}.` },
      });
      const result = await createGitHubPrPackage({
        repo: project.repo,
        baseBranch: project.gitBranch || "main",
        branch: change.branch,
        title: `AI delivery: ${requirement.title}`,
        body: change.summary,
        token,
      });

      await prisma.$transaction([
        prisma.requirement.update({ where: { id: requirementId }, data: { status: "PR_READY" } }),
        prisma.agentRun.update({ where: { id: run.id }, data: { status: "COMPLETED", output: result.prUrl } }),
        prisma.agentRunStep.create({ data: { runId: run.id, name: "GitHub PR package ready", status: "COMPLETED", detail: `GitHub PR package is ready: ${result.prUrl}`, output: result.prUrl } }),
        prisma.codeChange.update({ where: { id: change.id }, data: { status: "PR_READY", prUrl: result.prUrl, commitSha: result.commitSha, runId: run.id } }),
        prisma.decision.updateMany({ where: { projectId, title: { contains: "Approve GitHub PR creation" }, status: "PENDING" }, data: { status: "APPROVED", blocking: false } }),
        prisma.artifact.create({ data: { projectId, name: `${project.name} GitHub PR package`, type: "Code Note", owner: "System", status: "DRAFT" } }),
        prisma.ledgerEvent.create({ data: { projectId, title: "GitHub PR package created", detail: `PR package created for ${change.branch}: ${result.prUrl}`, objectType: "AgentRun", objectId: run.id } }),
      ]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "GitHub PR package creation failed.";
      await prisma.$transaction([
        prisma.agentRun.update({ where: { id: run.id }, data: { status: "FAILED", error: detail } }),
        prisma.agentRunStep.create({ data: { runId: run.id, name: "GitHub PR failed", status: "FAILED", detail, error: detail } }),
        prisma.codeChange.update({ where: { id: change.id }, data: { status: "BLOCKED" } }),
        prisma.ledgerEvent.create({ data: { projectId, title: "GitHub PR creation failed", detail, objectType: "AgentRun", objectId: run.id } }),
      ]);
      await createBlockingDecision(projectId, `GitHub PR failed: ${requirement.title}`, detail);
    }
  }

  revalidateWorkspace(projectId, "requirements");
  revalidateWorkspace(projectId, "activity");
  revalidateWorkspace(projectId, "artifacts");
  revalidateWorkspace(projectId, "decisions");
}

export async function syncVercelDeployment(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const requirementId = text(formData, "requirementId");
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  const requirement = await prisma.requirement.findUnique({ where: { id: requirementId } });
  const change = await prisma.codeChange.findFirst({ where: { projectId, requirementId }, orderBy: { updatedAt: "desc" } });

  if (!project || !requirement || !change) {
    throw new Error("Project, requirement, and code change are required.");
  }

  const run = await prisma.agentRun.create({
    data: {
      projectId,
      requirementId,
      type: "DEPLOY",
      status: "RUNNING",
      provider: "vercel",
      model: "deployment-sync",
      input: change.prUrl || change.branch,
    },
  });

  if (!project.vercelProject || !project.vercelTeam) {
    const detail = "Project Vercel team/project is not configured.";
    await createBlockingDecision(projectId, `Vercel deployment blocked: ${project.name}`, detail);
    await prisma.$transaction([
      prisma.agentRun.update({ where: { id: run.id }, data: { status: "BLOCKED", error: detail } }),
      prisma.agentRunStep.create({ data: { runId: run.id, name: "Vercel sync blocked", status: "BLOCKED", detail, error: detail } }),
      prisma.ledgerEvent.create({ data: { projectId, title: "Vercel deployment blocked", detail, objectType: "AgentRun", objectId: run.id } }),
    ]);
  } else {
    const url = project.previewUrl || `https://${project.vercelProject}.vercel.app`;
    const deployment = await readLatestVercelDeployment(project, url);
    await prisma.$transaction([
      prisma.requirement.update({ where: { id: requirementId }, data: { status: "DEPLOYED" } }),
      prisma.agentRun.update({ where: { id: run.id }, data: { status: "COMPLETED", output: deployment.url } }),
      prisma.agentRunStep.create({ data: { runId: run.id, name: "Vercel preview synced", status: "COMPLETED", detail: `Preview deployment recorded for ${change.branch}.`, output: deployment.url } }),
      prisma.deployment.create({
        data: {
          projectId,
          environment: "PREVIEW",
          status: deployment.status,
          url: deployment.url,
          branch: change.branch,
          sourceRunId: run.id,
          vercelDeploymentId: deployment.vercelDeploymentId,
          buildStatus: deployment.buildStatus,
          logsUrl: deployment.logsUrl,
        },
      }),
      prisma.ledgerEvent.create({ data: { projectId, title: "Vercel preview synced", detail: `Preview deployment recorded for ${change.branch}: ${deployment.url}`, objectType: "AgentRun", objectId: run.id } }),
    ]);
  }

  revalidateWorkspace(projectId, "requirements");
  revalidateWorkspace(projectId, "deployments");
  revalidateWorkspace(projectId, "activity");
}

export async function markRequirementAccepted(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const requirementId = text(formData, "requirementId");

  await prisma.$transaction([
    prisma.requirement.update({ where: { id: requirementId }, data: { status: "ACCEPTED" } }),
    prisma.agentRun.create({
      data: {
        projectId,
        requirementId,
        type: "QA",
        status: "COMPLETED",
        provider: "boss",
        model: "manual-acceptance",
        input: "Boss acceptance",
        output: "Requirement accepted after preview verification.",
        steps: {
          create: {
            name: "Boss accepted delivery",
            status: "COMPLETED",
            detail: "Boss marked the requirement as accepted after preview verification.",
          },
        },
      },
    }),
    prisma.review.create({ data: { projectId, type: "Boss Acceptance", owner: "Boss", result: "PASS", summary: `${requirementId} accepted after preview verification.` } }),
    prisma.ledgerEvent.create({ data: { projectId, title: "Requirement accepted", detail: `${requirementId} marked accepted by Boss.`, objectType: "Requirement", objectId: requirementId } }),
  ]);

  revalidateWorkspace(projectId, "requirements");
  revalidateWorkspace(projectId, "reviews");
  revalidateWorkspace(projectId, "memory");
}

export async function createProject(formData: FormData) {
  requireDatabase();

  const name = text(formData, "name");
  const goal = text(formData, "goal");
  const targetUsers = text(formData, "targetUsers");
  const gitUrl = text(formData, "gitUrl");
  const repo = parseGitRepository(text(formData, "repo") || gitUrl);
  const vercelProjectUrl = text(formData, "vercelProjectUrl");
  const parsedVercel = parseVercelProjectUrl(vercelProjectUrl);
  const previewUrl = text(formData, "previewUrl") || parsePreviewUrl(vercelProjectUrl);
  const nextActions = text(formData, "nextActions");
  const gitProvider = text(formData, "gitProvider") || "GitHub";
  const gitBranch = text(formData, "gitBranch") || "main";
  const vercelTeam = text(formData, "vercelTeam") || parsedVercel.team;
  const vercelProject = text(formData, "vercelProject") || parsedVercel.project || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const databaseProvider = text(formData, "databaseProvider") || "Supabase Postgres";
  const projectDatabaseUrl = text(formData, "projectDatabaseUrl");

  if (!name || !goal || !targetUsers) {
    throw new Error("Project name, goal, and target users are required.");
  }

  const encryptedDatabaseUrl = encryptedOptional(projectDatabaseUrl);

  const project = await prisma.project.create({
    data: {
      name,
      goal,
      targetUsers,
      repo,
      previewUrl,
      gitProvider,
      gitBranch,
      vercelTeam: vercelTeam || null,
      vercelProject: vercelProject || null,
      databaseProvider,
      databaseUrl: encryptedDatabaseUrl,
      databaseUrlEncrypted: Boolean(encryptedDatabaseUrl),
      nextActions,
      progress: 5,
      deployments: previewUrl
        ? {
            create: {
              environment: "PREVIEW",
              status: "READY",
              url: previewUrl,
              branch: gitBranch,
            },
          }
        : undefined,
      ledger: {
        create: {
          title: "Project created",
          detail: `Boss created a Web project with ${gitProvider}, ${vercelProject ? "Vercel project configured" : "Vercel pending"}, and ${encryptedDatabaseUrl ? "database configured" : "database pending"}.`,
        },
      },
      tasks: {
        create: [
          {
            title: "AI PM drafts PRD",
            type: "PRD",
            stage: "PRD_REVIEW",
            team: "PM",
            owner: "Mira",
            reviewer: "Boss",
            status: "TODO",
            priority: "P0",
            deliverable: "Initial PRD draft",
            acceptance: "PRD includes goal, users, scope, stories, and acceptance criteria.",
          },
          {
            title: "RD Lead prepares tech review",
            type: "Review",
            stage: "TECH_REVIEW",
            team: "RD",
            owner: "Kai",
            reviewer: "Boss",
            status: "TODO",
            priority: "P1",
            deliverable: "Technical plan",
            acceptance: "Architecture, branch strategy, commands, and deployment plan are explicit.",
          },
        ],
      },
      knowledgeDocuments: {
        create: [
          { filename: "product.md", title: "Product Brief", summary: goal },
          { filename: "prd.md", title: "PRD", summary: "Created from Web project template." },
          { filename: "architecture.md", title: "Architecture", summary: "Pending RD Lead technical review." },
          { filename: "qa.md", title: "QA Strategy", summary: "Pending QA case review." },
          { filename: "decisions.md", title: "Decision Log", summary: "Boss decisions will be recorded here." },
        ],
      },
    },
  });

  const agents = [
    { id: `pm-${project.id}`, name: "Mira", team: "PM", role: "PM Lead", status: "WORKING", provider: "gpt", model: "gpt-5.4", capabilities: "PRD\nUser Story\nAcceptance" },
    { id: `rd-${project.id}`, name: "Kai", team: "RD", role: "RD Lead", status: "IDLE", provider: "claude", model: "claude-sonnet-4.5", capabilities: "Architecture\nCode Review\nBranch Strategy" },
    { id: `qa-${project.id}`, name: "Iris", team: "QA", role: "QA Lead", status: "IDLE", provider: "gemini", model: "gemini-2.5-pro", capabilities: "Test Strategy\nBug Triage" },
    { id: `ux-${project.id}`, name: "Lena", team: "UI/UX", role: "UI/UX Lead", status: "IDLE", provider: "minimax", model: "minimax-m1", capabilities: "Design Review\nInteraction Flow" },
  ];

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { id: agent.id },
      update: {
        name: agent.name,
        team: agent.team,
        role: agent.role,
        status: agent.status as never,
        provider: agent.provider,
        model: agent.model,
        capabilities: agent.capabilities,
      },
      create: {
        id: agent.id,
        name: agent.name,
        team: agent.team,
        role: agent.role,
        status: agent.status as never,
        provider: agent.provider,
        model: agent.model,
        capabilities: agent.capabilities,
        projectAgents: {
          create: { projectId: project.id },
        },
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function createTask(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const title = text(formData, "title");
  const owner = text(formData, "owner") || "Unassigned";
  const team = text(formData, "team") || "RD";
  const stage = (text(formData, "stage") || "Development") as ProjectStage;
  const status = (text(formData, "status") || "Todo") as TaskStatus;
  const priority = text(formData, "priority") || "P2";
  const deliverable = text(formData, "deliverable");
  const acceptance = text(formData, "acceptance");

  if (!projectId || !title) {
    throw new Error("Project and task title are required.");
  }

  await prisma.$transaction([
    prisma.task.create({
      data: {
        projectId,
        title,
        type: "Development",
        stage: stageToDb[stage] as never,
        team,
        owner,
        status: taskStatusToDb[status] as never,
        priority: priority as never,
        deliverable,
        acceptance,
      },
    }),
    prisma.ledgerEvent.create({
      data: {
        projectId,
        title: "Task created",
        detail: `${owner} received task: ${title}`,
      },
    }),
  ]);

  revalidateWorkspace(projectId, "tasks");
}

export async function createDecision(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const title = text(formData, "title");
  const raisedBy = text(formData, "raisedBy") || "Agent";
  const type = text(formData, "type") || "Technical trade-off";
  const recommendation = text(formData, "recommendation");
  const impact = text(formData, "impact");
  const status = (text(formData, "status") || "Pending") as DecisionStatus;
  const blocking = text(formData, "blocking") === "on";

  if (!projectId || !title || !recommendation || !impact) {
    throw new Error("Project, title, recommendation, and impact are required.");
  }

  await prisma.$transaction([
    prisma.decision.create({
      data: {
        projectId,
        title,
        raisedBy,
        owner: "Boss",
        type,
        status: decisionStatusToDb[status] as never,
        blocking,
        recommendation,
        impact,
      },
    }),
    prisma.ledgerEvent.create({
      data: {
        projectId,
        title: "Decision requested",
        detail: `${raisedBy} escalated to Boss: ${title}`,
      },
    }),
  ]);

  revalidateWorkspace(projectId, "decisions");
}

export async function updateTaskStatus(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const taskId = text(formData, "taskId");
  const status = text(formData, "status") as TaskStatus;

  await prisma.$transaction([
    prisma.task.update({ where: { id: taskId }, data: { status: taskStatusToDb[status] as never } }),
    prisma.ledgerEvent.create({ data: { projectId, title: "Task status changed", detail: `${taskId} moved to ${status}.` } }),
  ]);

  revalidateWorkspace(projectId, "tasks");
}

export async function updateDecisionStatus(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const decisionId = text(formData, "decisionId");
  const status = text(formData, "status") as DecisionStatus;

  await prisma.$transaction([
    prisma.decision.update({ where: { id: decisionId }, data: { status: decisionStatusToDb[status] as never } }),
    prisma.ledgerEvent.create({ data: { projectId, title: "Decision updated", detail: `${decisionId} marked ${status}.` } }),
  ]);

  revalidateWorkspace(projectId, "decisions");
}

export async function createBug(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const title = text(formData, "title");
  const severity = text(formData, "severity") || "P2";
  const owner = text(formData, "owner") || "Unassigned";
  const reproduction = text(formData, "reproduction");

  if (!projectId || !title || !reproduction) {
    throw new Error("Project, bug title, and reproduction are required.");
  }

  await prisma.$transaction([
    prisma.bug.create({ data: { projectId, title, severity: severity as never, owner, reproduction } }),
    prisma.ledgerEvent.create({ data: { projectId, title: "Bug found", detail: `${severity} bug recorded: ${title}` } }),
  ]);

  revalidateWorkspace(projectId, "bugs");
}

export async function updateBugStatus(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const bugId = text(formData, "bugId");
  const status = text(formData, "status").toUpperCase();

  await prisma.$transaction([
    prisma.bug.update({ where: { id: bugId }, data: { status: status as never } }),
    prisma.ledgerEvent.create({ data: { projectId, title: "Bug status changed", detail: `${bugId} moved to ${status}.` } }),
  ]);

  revalidateWorkspace(projectId, "bugs");
}

export async function createReview(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const type = text(formData, "type") || "Tech";
  const owner = text(formData, "owner") || "Lead";
  const summary = text(formData, "summary");

  if (!projectId || !summary) {
    throw new Error("Project and review summary are required.");
  }

  await prisma.$transaction([
    prisma.review.create({ data: { projectId, type, owner, summary } }),
    prisma.ledgerEvent.create({ data: { projectId, title: "Review created", detail: `${type} review created by ${owner}.` } }),
  ]);

  revalidateWorkspace(projectId, "reviews");
}

export async function updateReviewResult(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const reviewId = text(formData, "reviewId");
  const result = text(formData, "result").toUpperCase().replaceAll(" ", "_");

  await prisma.$transaction([
    prisma.review.update({ where: { id: reviewId }, data: { result: result as never } }),
    prisma.ledgerEvent.create({ data: { projectId, title: "Review result updated", detail: `${reviewId} marked ${result}.` } }),
  ]);

  revalidateWorkspace(projectId, "reviews");
}

export async function createKnowledgeDocument(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const filename = text(formData, "filename");
  const title = text(formData, "title");
  const summary = text(formData, "summary");

  if (!projectId || !filename || !title || !summary) {
    throw new Error("Project, filename, title, and summary are required.");
  }

  await prisma.$transaction([
    prisma.knowledgeDocument.upsert({
      where: { projectId_filename: { projectId, filename } },
      update: { title, summary },
      create: { projectId, filename, title, summary },
    }),
    prisma.ledgerEvent.create({ data: { projectId, title: "Knowledge updated", detail: `${filename} saved in project knowledge base.` } }),
  ]);

  revalidateWorkspace(projectId, "knowledge");
}

export async function createHandover(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const fromAgent = text(formData, "fromAgent") || "Lead";
  const toAgent = text(formData, "toAgent") || "New Agent";
  const objective = text(formData, "objective");
  const scope = text(formData, "scope");

  if (!projectId || !objective || !scope) {
    throw new Error("Project, objective, and scope are required.");
  }

  await prisma.$transaction([
    prisma.handoverPackage.create({ data: { projectId, fromAgent, toAgent, objective, scope, status: "READY" } }),
    prisma.ledgerEvent.create({ data: { projectId, title: "Handover created", detail: `${fromAgent} prepared handover for ${toAgent}.` } }),
  ]);

  revalidateWorkspace(projectId, "handover");
}

export async function createDeployment(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const environment = text(formData, "environment").toUpperCase() || "PREVIEW";
  const url = text(formData, "url");
  const branch = text(formData, "branch") || "dev";

  if (!projectId || !url) {
    throw new Error("Project and deployment URL are required.");
  }

  await prisma.$transaction([
    prisma.deployment.create({ data: { projectId, environment: environment as never, status: "READY", url, branch } }),
    prisma.ledgerEvent.create({ data: { projectId, title: "Deployment completed", detail: `${environment} deployment is ready: ${url}` } }),
  ]);

  revalidateWorkspace(projectId, "deployments");
}

export async function createArtifact(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const name = text(formData, "name");
  const type = text(formData, "type") || "Code Note";
  const owner = text(formData, "owner") || "Agent";

  if (!projectId || !name) {
    throw new Error("Project and artifact name are required.");
  }

  await prisma.$transaction([
    prisma.artifact.create({ data: { projectId, name, type, owner, status: "DRAFT" } }),
    prisma.ledgerEvent.create({ data: { projectId, title: "Artifact created", detail: `${type} artifact registered: ${name}` } }),
  ]);

  revalidateWorkspace(projectId, "artifacts");
}

export async function createAgent(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const name = text(formData, "name");
  const team = text(formData, "team") || "RD";
  const role = text(formData, "role") || `${team} Agent`;
  const capabilities = text(formData, "capabilities");
  const provider = agentProvider(formData);
  const model = agentModel(formData, provider);
  const apiKey = encryptedOptional(text(formData, "apiKey"));

  if (!projectId || !name) {
    throw new Error("Project and agent name are required.");
  }

  await prisma.$transaction(async (tx) => {
    const agent = await tx.agent.create({
      data: {
        name,
        team,
        role,
        capabilities,
        status: "IDLE",
        provider,
        model,
        apiKey,
        apiKeyEncrypted: Boolean(apiKey),
      },
    });
    await tx.projectAgent.create({ data: { projectId, agentId: agent.id } });
    await tx.ledgerEvent.create({ data: { projectId, title: "Agent joined", detail: `${name} joined as ${role} using ${provider}/${model}.` } });
  });

  revalidateWorkspace(projectId);
  revalidatePath("/ai-organization");
}

export async function assignAgentToProject(formData: FormData) {
  requireDatabase();

  const projectId = text(formData, "projectId");
  const agentId = text(formData, "agentId");

  if (!projectId || !agentId) {
    throw new Error("Project and agent are required.");
  }

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });

  if (!agent) {
    throw new Error("Agent not found.");
  }

  await prisma.$transaction([
    prisma.projectAgent.upsert({
      where: { projectId_agentId: { projectId, agentId } },
      update: {},
      create: { projectId, agentId },
    }),
    prisma.ledgerEvent.create({
      data: {
        projectId,
        title: "Agent assigned",
        detail: `${agent.name} joined this Project Workspace as ${agent.role}.`,
      },
    }),
  ]);

  revalidateWorkspace(projectId, "agents");
  revalidatePath("/ai-organization");
}

export async function createGlobalAgent(formData: FormData) {
  requireDatabase();

  const name = text(formData, "name");
  const team = text(formData, "team") || "RD";
  const role = text(formData, "role") || `${team} Agent`;
  const capabilities = text(formData, "capabilities");
  const status = text(formData, "status") || "IDLE";
  const provider = agentProvider(formData);
  const model = agentModel(formData, provider);
  const apiKey = encryptedOptional(text(formData, "apiKey"));

  if (!name) {
    throw new Error("Agent name is required.");
  }

  await prisma.agent.create({
    data: {
      name,
      team,
      role,
      capabilities,
      status: status as never,
      provider,
      model,
      apiKey,
      apiKeyEncrypted: Boolean(apiKey),
    },
  });

  revalidatePath("/ai-organization");
  revalidatePath("/dashboard");
}

export async function updateGlobalAgent(formData: FormData) {
  requireDatabase();

  const agentId = text(formData, "agentId");
  const name = text(formData, "name");
  const team = text(formData, "team") || "RD";
  const role = text(formData, "role") || `${team} Agent`;
  const capabilities = text(formData, "capabilities");
  const status = text(formData, "status") || "IDLE";
  const provider = agentProvider(formData);
  const model = agentModel(formData, provider);
  const rawApiKey = text(formData, "apiKey");

  if (!agentId || !name) {
    throw new Error("Agent id and name are required.");
  }

  const apiKeyUpdate = rawApiKey
    ? {
        apiKey: encryptedOptional(rawApiKey),
        apiKeyEncrypted: true,
      }
    : {};

  await prisma.agent.update({
    where: { id: agentId },
    data: {
      name,
      team,
      role,
      capabilities,
      status: status as never,
      provider,
      model,
      ...apiKeyUpdate,
    },
  });

  revalidatePath("/ai-organization");
  revalidatePath("/dashboard");
}
