"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  const repo = text(formData, "repo");
  const previewUrl = text(formData, "previewUrl");
  const nextActions = text(formData, "nextActions");

  if (!name || !goal || !targetUsers) {
    throw new Error("Project name, goal, and target users are required.");
  }

  const project = await prisma.project.create({
    data: {
      name,
      goal,
      targetUsers,
      repo,
      previewUrl,
      nextActions,
      progress: 5,
      ledger: {
        create: {
          title: "Project created",
          detail: "Boss created a Web project from Projects.",
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
    { id: `pm-${project.id}`, name: "Mira", team: "PM", role: "PM Lead", status: "WORKING", capabilities: "PRD\nUser Story\nAcceptance" },
    { id: `rd-${project.id}`, name: "Kai", team: "RD", role: "RD Lead", status: "IDLE", capabilities: "Architecture\nCode Review\nBranch Strategy" },
    { id: `qa-${project.id}`, name: "Iris", team: "QA", role: "QA Lead", status: "IDLE", capabilities: "Test Strategy\nBug Triage" },
    { id: `ux-${project.id}`, name: "Lena", team: "UI/UX", role: "UI/UX Lead", status: "IDLE", capabilities: "Design Review\nInteraction Flow" },
  ];

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { id: agent.id },
      update: {
        name: agent.name,
        team: agent.team,
        role: agent.role,
        status: agent.status as never,
        capabilities: agent.capabilities,
      },
      create: {
        id: agent.id,
        name: agent.name,
        team: agent.team,
        role: agent.role,
        status: agent.status as never,
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

  if (!projectId || !name) {
    throw new Error("Project and agent name are required.");
  }

  await prisma.$transaction(async (tx) => {
    const agent = await tx.agent.create({ data: { name, team, role, capabilities, status: "IDLE" } });
    await tx.projectAgent.create({ data: { projectId, agentId: agent.id } });
    await tx.ledgerEvent.create({ data: { projectId, title: "Agent joined", detail: `${name} joined as ${role}.` } });
  });

  revalidateWorkspace(projectId);
  revalidatePath("/ai-organization");
}

export async function createGlobalAgent(formData: FormData) {
  requireDatabase();

  const name = text(formData, "name");
  const team = text(formData, "team") || "RD";
  const role = text(formData, "role") || `${team} Agent`;
  const capabilities = text(formData, "capabilities");
  const status = text(formData, "status") || "IDLE";

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

  if (!agentId || !name) {
    throw new Error("Agent id and name are required.");
  }

  await prisma.agent.update({
    where: { id: agentId },
    data: {
      name,
      team,
      role,
      capabilities,
      status: status as never,
    },
  });

  revalidatePath("/ai-organization");
  revalidatePath("/dashboard");
}
