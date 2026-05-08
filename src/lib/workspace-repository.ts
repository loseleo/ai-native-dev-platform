import { prisma } from "@/lib/prisma";
import {
  agents as seedAgents,
  agentRuns as seedAgentRuns,
  agentRunSteps as seedAgentRunSteps,
  bugs as seedBugs,
  codeChanges as seedCodeChanges,
  decisions as seedDecisions,
  getProjectData as getSeedProjectData,
  projects as seedProjects,
  tasks as seedTasks,
  type Agent,
  type AgentRun,
  type AgentRunStep,
  type AgentStatus,
  type Artifact,
  type Bug,
  type CodeChange,
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
  availability?: string | null;
  systemPrompt?: string | null;
  userPrompt?: string | null;
  capabilities: string;
  projectAgents?: { projectId: string; status?: string | null }[];
}): Agent {
  return {
    id: agent.id,
    name: agent.name,
    team: agent.team as Agent["team"],
    role: agent.role,
    status: agentStatusToDisplay[agent.status] ?? "Idle",
    availability: agent.availability === "OFFLINE" ? "Offline" : "Online",
    provider: (agent.provider ?? "gpt") as Agent["provider"],
    model: agent.model ?? "gpt-5.4",
    keyConfigured: Boolean(agent.apiKey),
    systemPrompt: agent.systemPrompt ?? "",
    userPrompt: agent.userPrompt ?? "",
    capabilities: safeJsonList(agent.capabilities),
    projectIds: agent.projectAgents?.filter((item) => (item.status ?? "ACTIVE") === "ACTIVE").map((item) => item.projectId) ?? [],
  };
}

function mapRequirement(requirement: {
  id: string;
  projectId: string;
  title: string;
  prompt: string;
  targetUsers: string;
  scope: string;
  acceptance: string;
  techPreference: string;
  status: string;
}): import("@/lib/data").Requirement {
  const statuses: Record<string, import("@/lib/data").Requirement["status"]> = {
    DRAFT: "Draft",
    PLANNED: "Planned",
    APPROVED: "Approved",
    CODE_READY: "Code Ready",
    PR_READY: "PR Ready",
    DEPLOYED: "Deployed",
    ACCEPTED: "Accepted",
    BLOCKED: "Blocked",
  };

  return {
    id: requirement.id,
    projectId: requirement.projectId,
    title: requirement.title,
    prompt: requirement.prompt,
    targetUsers: requirement.targetUsers,
    scope: requirement.scope,
    acceptance: requirement.acceptance,
    techPreference: requirement.techPreference,
    status: statuses[requirement.status] ?? "Draft",
  };
}

function mapAgentRun(run: {
  id: string;
  projectId: string;
  requirementId: string | null;
  type: string;
  status: string;
  provider: string;
  model: string;
  input: string;
  output: string | null;
  error: string | null;
  createdAt: Date;
  agent?: { name: string } | null;
}): AgentRun {
  const statuses: Record<string, AgentRun["status"]> = {
    QUEUED: "Queued",
    RUNNING: "Running",
    WAITING_APPROVAL: "Waiting Approval",
    COMPLETED: "Completed",
    FAILED: "Failed",
    BLOCKED: "Blocked",
  };
  const types: Record<string, AgentRun["type"]> = {
    PLAN: "Plan",
    CODE: "Code",
    PR: "PR",
    DEPLOY: "Deploy",
    QA: "QA",
  };

  return {
    id: run.id,
    projectId: run.projectId,
    requirementId: run.requirementId ?? "",
    agentName: run.agent?.name ?? "System",
    type: types[run.type] ?? "Plan",
    status: statuses[run.status] ?? "Queued",
    provider: run.provider,
    model: run.model,
    input: run.input,
    output: run.output ?? "",
    error: run.error ?? "",
    createdAt: run.createdAt.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }),
  };
}

function mapAgentRunStep(step: {
  id: string;
  runId: string;
  name: string;
  status: string;
  detail: string;
  output: string | null;
  error: string | null;
  createdAt: Date;
}): AgentRunStep {
  const statuses: Record<string, AgentRunStep["status"]> = {
    QUEUED: "Queued",
    RUNNING: "Running",
    COMPLETED: "Completed",
    FAILED: "Failed",
    BLOCKED: "Blocked",
  };

  return {
    id: step.id,
    runId: step.runId,
    name: step.name,
    status: statuses[step.status] ?? "Queued",
    detail: step.detail,
    output: step.output ?? "",
    error: step.error ?? "",
    createdAt: step.createdAt.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }),
  };
}

function mapCodeChange(change: {
  id: string;
  projectId: string;
  requirementId: string | null;
  runId: string | null;
  branch: string;
  commitSha: string | null;
  prUrl: string | null;
  summary: string;
  status: string;
}): CodeChange {
  const statuses: Record<string, CodeChange["status"]> = {
    PLANNED: "Planned",
    APPROVED: "Approved",
    GENERATED: "Generated",
    PR_READY: "PR Ready",
    BLOCKED: "Blocked",
    MERGED: "Merged",
  };

  return {
    id: change.id,
    projectId: change.projectId,
    requirementId: change.requirementId ?? "",
    runId: change.runId ?? "",
    branch: change.branch,
    commitSha: change.commitSha ?? "",
    prUrl: change.prUrl ?? "",
    summary: change.summary,
    status: statuses[change.status] ?? "Planned",
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
        requirements: true,
        agentRuns: { include: { agent: true, steps: true }, orderBy: { createdAt: "desc" } },
        codeChanges: true,
        projectAgents: { where: { status: "ACTIVE" }, include: { agent: true } },
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
          objectType: event.objectType ?? undefined,
          objectId: event.objectId ?? undefined,
        }),
      ),
      requirements: project.requirements.map(mapRequirement),
      agentRuns: project.agentRuns.map(mapAgentRun),
      agentRunSteps: project.agentRuns.flatMap((run) => run.steps.map(mapAgentRunStep)),
      codeChanges: project.codeChanges.map(mapCodeChange),
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
          vercelDeploymentId: deployment.vercelDeploymentId ?? undefined,
          sourceRunId: deployment.sourceRunId ?? undefined,
          buildStatus: deployment.buildStatus ?? undefined,
          logsUrl: deployment.logsUrl ?? undefined,
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
      agents: project.projectAgents.map((item) => mapAgent({ ...item.agent, projectAgents: [{ projectId, status: item.status }] })),
    };
  } catch {
    return getSeedProjectData(projectId);
  }
}

export async function createRequirement() {
  throw new Error("createRequirement is implemented as a server action.");
}

export async function listProjectRuns(projectId: string): Promise<AgentRun[]> {
  const workspace = await getWorkspaceData(projectId);
  return workspace.agentRuns ?? seedAgentRuns.filter((run) => run.projectId === projectId);
}

export async function getRunDetail(projectId: string, runId: string) {
  const workspace = await getWorkspaceData(projectId);
  return {
    run: workspace.agentRuns?.find((run) => run.id === runId),
    steps: workspace.agentRunSteps?.filter((step) => step.runId === runId) ?? seedAgentRunSteps.filter((step) => step.runId === runId),
    codeChanges: workspace.codeChanges?.filter((change) => change.runId === runId) ?? seedCodeChanges.filter((change) => change.runId === runId),
  };
}

export async function createAgentRun() {
  throw new Error("createAgentRun is implemented as a server action.");
}

export async function appendRunStep() {
  throw new Error("appendRunStep is implemented as a server action.");
}

export async function createCodeChange() {
  throw new Error("createCodeChange is implemented as a server action.");
}

export async function linkDeploymentToRun() {
  throw new Error("linkDeploymentToRun is implemented as a server action.");
}
