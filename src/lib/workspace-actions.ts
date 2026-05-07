"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { encryptSecret, hasEncryptionKey } from "@/lib/crypto";
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
