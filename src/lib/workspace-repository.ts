import { prisma } from "@/lib/prisma";
import {
  agents as seedAgents,
  bugs as seedBugs,
  decisions as seedDecisions,
  getProjectData as getSeedProjectData,
  projects as seedProjects,
  tasks as seedTasks,
  type Agent,
  type AgentStatus,
  type Artifact,
  type Bug,
  type Decision,
  type DecisionStatus,
  type Deployment,
  type HandoverPackage,
  type KnowledgeDoc,
  type LedgerEvent,
  type Priority,
  type Project,
  type ProjectStage,
  type Review,
  type Task,
  type TaskStatus,
} from "@/lib/data";

const stageToDisplay: Record<string, ProjectStage> = {
  DRAFT: "Draft",
  PRD_REVIEW: "PRD Review",
  BOSS_PRD_APPROVAL: "Boss PRD Approval",
  TECH_REVIEW: "Tech Review",
  UI_UX_REVIEW: "UI/UX Review",
  QA_CASE_REVIEW: "QA Case Review",
  DEVELOPMENT: "Development",
  CODE_REVIEW: "Code Review",
  QA_TESTING: "QA Testing",
  BUG_FIXING: "Bug Fixing",
  DEPLOYMENT: "Deployment",
  PM_ACCEPTANCE: "PM Acceptance",
  BOSS_ACCEPTANCE: "Boss Acceptance",
  RELEASED: "Released",
};

const statusToDisplay: Record<string, TaskStatus> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  BLOCKED: "Blocked",
  DONE: "Done",
  REJECTED: "Blocked",
  REOPENED: "Todo",
};

const decisionToDisplay: Record<string, DecisionStatus> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  NEEDS_MORE_INFO: "Needs More Info",
  RESOLVED: "Resolved",
};

const agentStatusToDisplay: Record<string, AgentStatus> = {
  DRAFT: "Idle",
  IDLE: "Idle",
  WORKING: "Working",
  PAUSED: "Paused",
  BLOCKED: "Blocked",
  UPGRADING: "Upgrading",
  DEPRECATED: "Paused",
  SHUTDOWN: "Paused",
  ERROR: "Blocked",
};

export const stageToDb: Record<ProjectStage, string> = Object.fromEntries(
  Object.entries(stageToDisplay).map(([key, value]) => [value, key]),
) as Record<ProjectStage, string>;

export const taskStatusToDb: Record<TaskStatus, string> = {
  Todo: "TODO",
  "In Progress": "IN_PROGRESS",
  "In Review": "IN_REVIEW",
  Blocked: "BLOCKED",
  Done: "DONE",
};

export const decisionStatusToDb: Record<DecisionStatus, string> = {
  Pending: "PENDING",
  Approved: "APPROVED",
  Rejected: "REJECTED",
  "Needs More Info": "NEEDS_MORE_INFO",
  Resolved: "RESOLVED",
};

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

function safeJsonList(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapProject(project: {
  id: string;
  name: string;
  type: string;
  stage: string;
  health: string;
  progress: number;
  goal: string;
  targetUsers: string;
  repo: string | null;
  gitProvider?: string | null;
  gitBranch?: string | null;
  vercelTeam?: string | null;
  vercelProject?: string | null;
  databaseProvider?: string | null;
  databaseUrl?: string | null;
  previewUrl: string | null;
  nextActions: string;
}): Project {
  return {
    id: project.id,
    name: project.name,
    type: "Web",
    stage: stageToDisplay[project.stage] ?? "Draft",
    health: project.health === "BLOCKED" ? "Blocked" : project.health === "AT_RISK" ? "At Risk" : "Healthy",
    progress: project.progress,
    goal: project.goal,
    targetUsers: project.targetUsers,
    repo: project.repo ?? "",
    gitProvider: project.gitProvider ?? "GitHub",
    gitBranch: project.gitBranch ?? "main",
    vercelTeam: project.vercelTeam ?? "",
    vercelProject: project.vercelProject ?? "",
    databaseProvider: project.databaseProvider ?? "Supabase Postgres",
    databaseConfigured: Boolean(project.databaseUrl),
    previewUrl: project.previewUrl ?? "",
    nextActions: safeJsonList(project.nextActions),
  };
}

function mapTask(task: {
  id: string;
  projectId: string;
  title: string;
  type: string;
  stage: string;
  team: string;
  owner: string;
  reviewer: string | null;
  status: string;
  priority: string;
  deliverable: string | null;
  acceptance: string | null;
}): Task {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    type: task.type as Task["type"],
    stage: stageToDisplay[task.stage] ?? "Draft",
    team: task.team as Task["team"],
    owner: task.owner,
    reviewer: task.reviewer ?? "",
    status: statusToDisplay[task.status] ?? "Todo",
    priority: task.priority as Priority,
    deliverable: task.deliverable ?? "",
    acceptance: task.acceptance ?? "",
  };
}

function mapDecision(decision: {
  id: string;
  projectId: string;
  title: string;
  raisedBy: string;
  owner: string;
  type: string;
  status: string;
  blocking: boolean;
  recommendation: string;
  impact: string;
}): Decision {
  return {
    id: decision.id,
    projectId: decision.projectId,
    title: decision.title,
    raisedBy: decision.raisedBy,
    owner: decision.owner as Decision["owner"],
    type: decision.type,
    status: decisionToDisplay[decision.status] ?? "Pending",
    blocking: decision.blocking,
    recommendation: decision.recommendation,
    impact: decision.impact,
  };
}

function mapAgent(agent: {
  id: string;
  name: string;
  team: string;
  role: string;
  status: string;
  provider?: string | null;
  model?: string | null;
  apiKey?: string | null;
  capabilities: string;
  projectAgents?: { projectId: string }[];
}): Agent {
  return {
    id: agent.id,
    name: agent.name,
    team: agent.team as Agent["team"],
    role: agent.role,
    status: agentStatusToDisplay[agent.status] ?? "Idle",
    provider: (agent.provider ?? "gpt") as Agent["provider"],
    model: agent.model ?? "gpt-5.4",
    keyConfigured: Boolean(agent.apiKey),
    capabilities: safeJsonList(agent.capabilities),
    projectIds: agent.projectAgents?.map((item) => item.projectId) ?? [],
  };
}

export async function listProjects(): Promise<Project[]> {
  if (!hasDatabaseUrl()) {
    return seedProjects;
  }

  try {
    const projects = await prisma.project.findMany({ orderBy: { updatedAt: "desc" } });
    return projects.map(mapProject);
  } catch {
    return seedProjects;
  }
}

export async function getProjectById(projectId: string): Promise<Project | undefined> {
  if (!hasDatabaseUrl()) {
    return seedProjects.find((project) => project.id === projectId);
  }

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    return project ? mapProject(project) : undefined;
  } catch {
    return seedProjects.find((project) => project.id === projectId);
  }
}

export async function listAgents(): Promise<Agent[]> {
  if (!hasDatabaseUrl()) {
    return seedAgents;
  }

  try {
    const agents = await prisma.agent.findMany({
      include: { projectAgents: true },
      orderBy: [{ team: "asc" }, { role: "asc" }],
    });
    return agents.map(mapAgent);
  } catch {
    return seedAgents;
  }
}

export async function listBossDecisions(): Promise<Decision[]> {
  if (!hasDatabaseUrl()) {
    return seedDecisions.filter((decision) => decision.owner === "Boss" && decision.status !== "Resolved");
  }

  try {
    const decisions = await prisma.decision.findMany({
      where: { owner: "Boss", NOT: { status: "RESOLVED" } },
      orderBy: [{ blocking: "desc" }, { updatedAt: "desc" }],
    });
    return decisions.map(mapDecision);
  } catch {
    return seedDecisions.filter((decision) => decision.owner === "Boss" && decision.status !== "Resolved");
  }
}

export async function listDashboardData() {
  if (!hasDatabaseUrl()) {
    return {
      projects: seedProjects,
      agents: seedAgents,
      tasks: seedTasks,
      bugs: seedBugs,
      decisions: seedDecisions,
    };
  }

  try {
    const [projects, agents, tasks, bugs, decisions] = await Promise.all([
      prisma.project.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.agent.findMany({ include: { projectAgents: true } }),
      prisma.task.findMany(),
      prisma.bug.findMany(),
      prisma.decision.findMany(),
    ]);

    return {
      projects: projects.map(mapProject),
      agents: agents.map(mapAgent),
      tasks: tasks.map(mapTask),
      bugs: bugs.map(
        (bug): Bug => ({
          id: bug.id,
          projectId: bug.projectId,
          title: bug.title,
          severity: bug.severity as Priority,
          status: bug.status === "CLOSED" ? "Closed" : bug.status === "VERIFYING" ? "Verifying" : bug.status === "FIXING" ? "Fixing" : "Open",
          owner: bug.owner,
          reproduction: bug.reproduction,
        }),
      ),
      decisions: decisions.map(mapDecision),
    };
  } catch {
    return {
      projects: seedProjects,
      agents: seedAgents,
      tasks: seedTasks,
      bugs: seedBugs,
      decisions: seedDecisions,
    };
  }
}

export async function getWorkspaceData(projectId: string) {
  if (!hasDatabaseUrl()) {
    return getSeedProjectData(projectId);
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
        decisions: true,
        bugs: true,
        reviews: true,
        ledger: { orderBy: { createdAt: "asc" } },
        knowledgeDocuments: true,
        handovers: true,
        deployments: true,
        artifacts: true,
        projectAgents: { include: { agent: true } },
      },
    });

    if (!project) {
      return getSeedProjectData(projectId);
    }

    return {
      project: mapProject(project),
      tasks: project.tasks.map(mapTask),
      decisions: project.decisions.map(mapDecision),
      bugs: project.bugs.map(
        (bug): Bug => ({
          id: bug.id,
          projectId: bug.projectId,
          title: bug.title,
          severity: bug.severity as Priority,
          status: bug.status === "CLOSED" ? "Closed" : bug.status === "VERIFYING" ? "Verifying" : bug.status === "FIXING" ? "Fixing" : "Open",
          owner: bug.owner,
          reproduction: bug.reproduction,
        }),
      ),
      reviews: project.reviews.map(
        (review): Review => ({
          id: review.id,
          projectId: review.projectId,
          type: review.type as Review["type"],
          owner: review.owner,
          result: review.result === "PASS" ? "Pass" : review.result === "NEEDS_CHANGE" ? "Needs Change" : "Pending",
          summary: review.summary,
        }),
      ),
      ledgerEvents: project.ledger.map(
        (event): LedgerEvent => ({
          id: event.id,
          projectId: event.projectId,
          time: event.createdAt.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }),
          title: event.title,
          detail: event.detail,
        }),
      ),
      knowledgeDocs: project.knowledgeDocuments.map(
        (doc): KnowledgeDoc => ({
          id: doc.id,
          projectId: doc.projectId,
          filename: doc.filename,
          title: doc.title,
          summary: doc.summary,
        }),
      ),
      handovers: project.handovers.map(
        (handover): HandoverPackage => ({
          id: handover.id,
          projectId: handover.projectId,
          from: handover.fromAgent,
          to: handover.toAgent,
          status: handover.status === "ACCEPTED" ? "Accepted" : handover.status === "READY" ? "Ready" : handover.status === "IN_REVIEW" ? "In Review" : "Draft",
          objective: handover.objective,
          scope: handover.scope,
        }),
      ),
      deployments: project.deployments.map(
        (deployment): Deployment => ({
          id: deployment.id,
          projectId: deployment.projectId,
          environment: deployment.environment === "PRODUCTION" ? "Production" : "Preview",
          status: deployment.status === "READY" ? "Ready" : deployment.status === "FAILED" ? "Failed" : deployment.status === "BUILDING" ? "Building" : "Queued",
          url: deployment.url,
          branch: deployment.branch,
        }),
      ),
      artifacts: project.artifacts.map(
        (artifact): Artifact => ({
          id: artifact.id,
          projectId: artifact.projectId,
          name: artifact.name,
          type: artifact.type as Artifact["type"],
          owner: artifact.owner,
          status: artifact.status === "APPROVED" ? "Approved" : artifact.status === "ARCHIVED" ? "Archived" : "Draft",
        }),
      ),
      agents: project.projectAgents.map((item) => mapAgent({ ...item.agent, projectAgents: [{ projectId }] })),
    };
  } catch {
    return getSeedProjectData(projectId);
  }
}
