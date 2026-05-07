export type ProjectStage =
  | "Draft"
  | "PRD Review"
  | "Boss PRD Approval"
  | "Tech Review"
  | "UI/UX Review"
  | "QA Case Review"
  | "Development"
  | "Code Review"
  | "QA Testing"
  | "Bug Fixing"
  | "Deployment"
  | "PM Acceptance"
  | "Boss Acceptance"
  | "Released";

export type TaskStatus = "Todo" | "In Progress" | "In Review" | "Blocked" | "Done";
export type Priority = "P0" | "P1" | "P2" | "P3";
export type AgentStatus = "Idle" | "Working" | "Paused" | "Blocked" | "Upgrading";
export type DecisionStatus = "Pending" | "Approved" | "Rejected" | "Needs More Info" | "Resolved";

export type Project = {
  id: string;
  name: string;
  type: "Web";
  stage: ProjectStage;
  health: "Healthy" | "At Risk" | "Blocked";
  progress: number;
  goal: string;
  targetUsers: string;
  repo: string;
  gitProvider: string;
  gitBranch: string;
  vercelTeam: string;
  vercelProject: string;
  databaseProvider: string;
  databaseConfigured: boolean;
  previewUrl: string;
  nextActions: string[];
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  type: "PRD" | "Review" | "Design" | "Development" | "Testing" | "Bug" | "Deployment";
  stage: ProjectStage;
  team: "PM" | "RD" | "QA" | "UI/UX";
  owner: string;
  reviewer: string;
  status: TaskStatus;
  priority: Priority;
  deliverable: string;
  acceptance: string;
};

export type Agent = {
  id: string;
  name: string;
  team: "PM" | "RD" | "QA" | "UI/UX";
  role: string;
  status: AgentStatus;
  provider: "gpt" | "gemini" | "minimax" | "claude";
  model: string;
  keyConfigured: boolean;
  capabilities: string[];
  projectIds: string[];
};

export type Decision = {
  id: string;
  projectId: string;
  title: string;
  raisedBy: string;
  owner: "Boss" | "PM Lead" | "RD Lead" | "QA Lead" | "UI/UX Lead";
  type: string;
  status: DecisionStatus;
  blocking: boolean;
  recommendation: string;
  impact: string;
};

export type Bug = {
  id: string;
  projectId: string;
  title: string;
  severity: Priority;
  status: "Open" | "Fixing" | "Verifying" | "Closed";
  owner: string;
  reproduction: string;
};

export type Review = {
  id: string;
  projectId: string;
  type: "PRD" | "Tech" | "UI/UX" | "QA Case" | "Code" | "PM Acceptance" | "Boss Acceptance";
  owner: string;
  result: "Pass" | "Needs Change" | "Pending";
  summary: string;
};

export type LedgerEvent = {
  id: string;
  projectId: string;
  time: string;
  title: string;
  detail: string;
  objectType?: string;
  objectId?: string;
};

export type Requirement = {
  id: string;
  projectId: string;
  title: string;
  prompt: string;
  targetUsers: string;
  scope: string;
  acceptance: string;
  techPreference: string;
  status: "Draft" | "Planned" | "Approved" | "Code Ready" | "PR Ready" | "Deployed" | "Accepted" | "Blocked";
};

export type AgentRun = {
  id: string;
  projectId: string;
  requirementId: string;
  agentName: string;
  type: "Plan" | "Code" | "PR" | "Deploy" | "QA";
  status: "Queued" | "Running" | "Waiting Approval" | "Completed" | "Failed" | "Blocked";
  provider: string;
  model: string;
  input: string;
  output: string;
  error: string;
  createdAt: string;
};

export type AgentRunStep = {
  id: string;
  runId: string;
  name: string;
  status: "Queued" | "Running" | "Completed" | "Failed" | "Blocked";
  detail: string;
  output: string;
  error: string;
  createdAt: string;
};

export type CodeChange = {
  id: string;
  projectId: string;
  requirementId: string;
  runId: string;
  branch: string;
  commitSha: string;
  prUrl: string;
  summary: string;
  status: "Planned" | "Approved" | "Generated" | "PR Ready" | "Blocked" | "Merged";
};

export type KnowledgeDoc = {
  id: string;
  projectId: string;
  filename: string;
  title: string;
  summary: string;
};

export type HandoverPackage = {
  id: string;
  projectId: string;
  from: string;
  to: string;
  status: "Draft" | "Ready" | "Accepted" | "In Review";
  objective: string;
  scope: string;
};

export type Deployment = {
  id: string;
  projectId: string;
  environment: "Preview" | "Production";
  status: "Queued" | "Building" | "Ready" | "Failed";
  url: string;
  branch: string;
  vercelDeploymentId?: string;
  sourceRunId?: string;
  buildStatus?: string;
  logsUrl?: string;
};

export type Artifact = {
  id: string;
  projectId: string;
  name: string;
  type: "PRD" | "Design" | "QA Report" | "Code Note" | "Release Note";
  owner: string;
  status: "Draft" | "Approved" | "Archived";
};

export const workflowStages: ProjectStage[] = [
  "Draft",
  "PRD Review",
  "Boss PRD Approval",
  "Tech Review",
  "UI/UX Review",
  "QA Case Review",
  "Development",
  "Code Review",
  "QA Testing",
  "Bug Fixing",
  "Deployment",
  "PM Acceptance",
  "Boss Acceptance",
  "Released",
];

export const projects: Project[] = [
  {
    id: "web-os",
    name: "AI Native Dev Platform",
    type: "Web",
    stage: "Development",
    health: "At Risk",
    progress: 58,
    goal: "让 Boss 像管理一家 AI 软件公司一样管理 Web 项目交付。",
    targetUsers: "Founder, Product Lead, Engineering Manager",
    repo: "loseleo/ai-native-dev-platform",
    gitProvider: "GitHub",
    gitBranch: "main",
    vercelTeam: "jingbos-projects",
    vercelProject: "ai-native-dev-platform",
    databaseProvider: "Supabase Postgres",
    databaseConfigured: true,
    previewUrl: "https://ai-native-dev-platform.vercel.app",
    nextActions: ["Approve Tech trade-off", "Review QA case readiness", "Assign independent RD handover"],
  },
  {
    id: "customer-portal",
    name: "Customer Portal Refresh",
    type: "Web",
    stage: "PRD Review",
    health: "Healthy",
    progress: 22,
    goal: "重构客户门户的信息架构与自助服务体验。",
    targetUsers: "Enterprise customer admins",
    repo: "loseleo/customer-portal-refresh",
    gitProvider: "GitHub",
    gitBranch: "main",
    vercelTeam: "",
    vercelProject: "customer-portal-refresh",
    databaseProvider: "Supabase Postgres",
    databaseConfigured: false,
    previewUrl: "https://customer-portal-refresh.vercel.app",
    nextActions: ["Boss approve PRD scope", "Confirm out-of-scope list"],
  },
];

export const agents: Agent[] = [
  { id: "pm-lead", name: "Mira", team: "PM", role: "PM Lead", status: "Working", provider: "gpt", model: "gpt-5.4", keyConfigured: true, capabilities: ["PRD", "User Story", "Acceptance"], projectIds: ["web-os", "customer-portal"] },
  { id: "rd-lead", name: "Kai", team: "RD", role: "RD Lead", status: "Working", provider: "claude", model: "claude-sonnet-4.5", keyConfigured: false, capabilities: ["Architecture", "Code Review", "Branch Strategy"], projectIds: ["web-os"] },
  { id: "rd-1", name: "Nova", team: "RD", role: "RD Agent", status: "Blocked", provider: "gpt", model: "gpt-5.4", keyConfigured: true, capabilities: ["Next.js", "Prisma", "API"], projectIds: ["web-os"] },
  { id: "qa-lead", name: "Iris", team: "QA", role: "QA Lead", status: "Idle", provider: "gemini", model: "gemini-2.5-pro", keyConfigured: false, capabilities: ["Test Strategy", "Bug Triage"], projectIds: ["web-os"] },
  { id: "ux-lead", name: "Lena", team: "UI/UX", role: "UI/UX Lead", status: "Paused", provider: "minimax", model: "minimax-m1", keyConfigured: false, capabilities: ["Design Review", "Interaction Flow"], projectIds: ["web-os", "customer-portal"] },
];

export const tasks: Task[] = [
  { id: "TASK-101", projectId: "web-os", title: "Setup Wizard 信息架构", type: "Development", stage: "Development", team: "RD", owner: "Nova", reviewer: "Kai", status: "In Progress", priority: "P0", deliverable: "Setup route + encrypted config form", acceptance: "未初始化时强制进入 Setup，完成后进入登录页。" },
  { id: "TASK-102", projectId: "web-os", title: "Project Workspace 导航收敛", type: "Development", stage: "Development", team: "RD", owner: "Nova", reviewer: "Kai", status: "In Review", priority: "P0", deliverable: "Nested workspace routes", acceptance: "Tasks/Bugs/Memory/Docs 都位于项目上下文内。" },
  { id: "TASK-103", projectId: "web-os", title: "QA Case Review 模板", type: "Testing", stage: "QA Case Review", team: "QA", owner: "Iris", reviewer: "Mira", status: "Todo", priority: "P1", deliverable: "QA scenario checklist", acceptance: "覆盖 PRD gate、workflow gate、release gate。" },
  { id: "TASK-104", projectId: "web-os", title: "Boss Decision Card", type: "Review", stage: "Tech Review", team: "PM", owner: "Mira", reviewer: "Boss", status: "Blocked", priority: "P0", deliverable: "Decision card with options", acceptance: "阻塞项必须聚合到全局 Decision Inbox。" },
  { id: "TASK-105", projectId: "web-os", title: "Release artifact registry", type: "Deployment", stage: "Deployment", team: "RD", owner: "Kai", reviewer: "Mira", status: "Done", priority: "P2", deliverable: "Artifact list", acceptance: "PRD、QA report、release note 可追踪。" },
  { id: "TASK-201", projectId: "customer-portal", title: "PRD draft review", type: "PRD", stage: "PRD Review", team: "PM", owner: "Mira", reviewer: "Boss", status: "In Progress", priority: "P1", deliverable: "Reviewed PRD", acceptance: "Boss 可审批或退回。" },
];

export const decisions: Decision[] = [
  { id: "DEC-31", projectId: "web-os", title: "本地 MySQL 与线上 Postgres 的 Prisma 策略", raisedBy: "Kai", owner: "Boss", type: "Technical trade-off", status: "Pending", blocking: true, recommendation: "使用双 schema，模型保持一致。", impact: "影响 migration 脚本和部署文档。" },
  { id: "DEC-32", projectId: "web-os", title: "Setup 是否允许保存失败的 Vercel token", raisedBy: "Mira", owner: "Boss", type: "Quality exception", status: "Needs More Info", blocking: false, recommendation: "允许草稿保存，但生产部署前必须验证。", impact: "提升 demo 可用性。" },
  { id: "DEC-41", projectId: "customer-portal", title: "客户门户二期是否包含 billing 页面", raisedBy: "Mira", owner: "Boss", type: "Scope change", status: "Pending", blocking: true, recommendation: "放入 out-of-scope，作为下一版本。", impact: "减少当前 PRD 风险。" },
];

export const bugs: Bug[] = [
  { id: "BUG-12", projectId: "web-os", title: "移动端 Kanban 列宽导致横向溢出", severity: "P1", status: "Fixing", owner: "Nova", reproduction: "在 390px 宽度打开任务页，拖动区域超出视口。" },
  { id: "BUG-13", projectId: "web-os", title: "Decision badge 与表格文字重叠", severity: "P2", status: "Verifying", owner: "Iris", reproduction: "Dashboard pending decisions 卡片在窄屏下出现文本挤压。" },
];

export const reviews: Review[] = [
  { id: "REV-1", projectId: "web-os", type: "PRD", owner: "Mira", result: "Pass", summary: "PRD 覆盖 Boss、AI Organization、Workflow、Memory、Handover。" },
  { id: "REV-2", projectId: "web-os", type: "Tech", owner: "Kai", result: "Needs Change", summary: "数据库自举路径需要明确 env 与 Setup 的职责边界。" },
  { id: "REV-3", projectId: "web-os", type: "QA Case", owner: "Iris", result: "Pending", summary: "等待 Boss 决策卡确认后补充阻塞场景。" },
];

export const ledgerEvents: LedgerEvent[] = [
  { id: "LED-1", projectId: "web-os", time: "09:10", title: "Project created", detail: "Boss created Web project and assigned PM Lead." },
  { id: "LED-2", projectId: "web-os", time: "10:30", title: "PRD reviewed", detail: "PM team completed PRD review and raised one scope question." },
  { id: "LED-3", projectId: "web-os", time: "13:20", title: "Tech trade-off escalated", detail: "RD Lead escalated database provider strategy to Boss." },
  { id: "LED-4", projectId: "web-os", time: "15:45", title: "Handover package drafted", detail: "RD Lead identified Workspace shell as independent task." },
];

export const knowledgeDocs: KnowledgeDoc[] = [
  { id: "DOC-1", projectId: "web-os", filename: "product.md", title: "Product Brief", summary: "Boss-driven AI Native Software Company OS." },
  { id: "DOC-2", projectId: "web-os", filename: "prd.md", title: "Approved PRD", summary: "Web project delivery demo with workflow, task, decision, memory." },
  { id: "DOC-3", projectId: "web-os", filename: "architecture.md", title: "Architecture", summary: "Next.js App Router, Auth.js, Prisma, MySQL local, Postgres online." },
  { id: "DOC-4", projectId: "web-os", filename: "design.md", title: "Design System", summary: "Modern operational UI with dense project context and clear gates." },
  { id: "DOC-5", projectId: "web-os", filename: "qa.md", title: "QA Strategy", summary: "Quality gates mapped to PRD, Tech, UI/UX, QA, Deployment, Acceptance." },
  { id: "DOC-6", projectId: "web-os", filename: "decisions.md", title: "Decision Log", summary: "Boss approvals and unresolved escalation items." },
  { id: "DOC-7", projectId: "web-os", filename: "risks.md", title: "Risks", summary: "Database provider divergence, setup bootstrap, auth hardening." },
  { id: "DOC-8", projectId: "web-os", filename: "glossary.md", title: "Glossary", summary: "Boss, Agent, Workflow, Handover, Project Memory." },
  { id: "DOC-9", projectId: "web-os", filename: "onboarding.md", title: "Onboarding", summary: "Role-specific briefs for new PM/RD/QA/UIUX agents." },
];

export const handovers: HandoverPackage[] = [
  { id: "HND-7", projectId: "web-os", from: "Kai", to: "Nova", status: "Accepted", objective: "Implement Project Workspace shell and route structure.", scope: "Navigation, overview, tasks, bugs, memory, knowledge, deployments." },
  { id: "HND-8", projectId: "web-os", from: "Nova", to: "New RD Agent", status: "Draft", objective: "Extract Setup form fields into reusable sections.", scope: "Boss account, Vercel settings, local/online database settings." },
];

export const deployments: Deployment[] = [
  { id: "DEP-1", projectId: "web-os", environment: "Preview", status: "Ready", url: "https://ai-native-dev-platform-git-dev.vercel.app", branch: "dev" },
  { id: "DEP-2", projectId: "web-os", environment: "Production", status: "Queued", url: "https://ai-native-dev-platform.vercel.app", branch: "main" },
];

export const requirements: Requirement[] = [
  {
    id: "REQ-1",
    projectId: "web-os",
    title: "Todolist web app delivery",
    prompt: "Build a todolist website with add, complete, delete, and filter.",
    targetUsers: "Solo operators and small teams",
    scope: "Next.js app with local task state, responsive table/list UI, empty state, and basic filters.",
    acceptance: "User can add todos, complete todos, delete todos, and filter all/active/completed.",
    techPreference: "Next.js + Tailwind + TypeScript",
    status: "Planned",
  },
];

export const agentRuns: AgentRun[] = [
  {
    id: "RUN-1",
    projectId: "web-os",
    requirementId: "REQ-1",
    agentName: "Mira",
    type: "Plan",
    status: "Waiting Approval",
    provider: "gpt",
    model: "gpt-5.4",
    input: "Todolist web app delivery",
    output: "PRD, task breakdown, technical plan, and QA checklist generated for Boss approval.",
    error: "",
    createdAt: "09:30",
  },
];

export const agentRunSteps: AgentRunStep[] = [
  { id: "STEP-1", runId: "RUN-1", name: "PRD draft", status: "Completed", detail: "PM Agent drafted PRD from requirement.", output: "PRD artifact ready.", error: "", createdAt: "09:31" },
  { id: "STEP-2", runId: "RUN-1", name: "Boss approval gate", status: "Queued", detail: "Waiting for Boss to approve the plan before code generation.", output: "", error: "", createdAt: "09:33" },
];

export const codeChanges: CodeChange[] = [
  {
    id: "CHG-1",
    projectId: "web-os",
    requirementId: "REQ-1",
    runId: "RUN-1",
    branch: "ai/req-1-todolist-web-app-delivery",
    commitSha: "",
    prUrl: "",
    summary: "Planned files for todolist implementation.",
    status: "Planned",
  },
];

export const artifacts: Artifact[] = [
  { id: "ART-1", projectId: "web-os", name: "AI Native Dev Platform PRD", type: "PRD", owner: "Mira", status: "Approved" },
  { id: "ART-2", projectId: "web-os", name: "Workspace IA Design Notes", type: "Design", owner: "Lena", status: "Approved" },
  { id: "ART-3", projectId: "web-os", name: "QA Gate Report", type: "QA Report", owner: "Iris", status: "Draft" },
  { id: "ART-4", projectId: "web-os", name: "Implementation Notes", type: "Code Note", owner: "Nova", status: "Draft" },
];

export function getProject(projectId: string) {
  return projects.find((project) => project.id === projectId);
}

export function getProjectData(projectId: string) {
  return {
    project: getProject(projectId),
    tasks: tasks.filter((task) => task.projectId === projectId),
    decisions: decisions.filter((decision) => decision.projectId === projectId),
    bugs: bugs.filter((bug) => bug.projectId === projectId),
    reviews: reviews.filter((review) => review.projectId === projectId),
    ledgerEvents: ledgerEvents.filter((event) => event.projectId === projectId),
    requirements: requirements.filter((requirement) => requirement.projectId === projectId),
    agentRuns: agentRuns.filter((run) => run.projectId === projectId),
    agentRunSteps: agentRunSteps.filter((step) => agentRuns.some((run) => run.projectId === projectId && run.id === step.runId)),
    codeChanges: codeChanges.filter((change) => change.projectId === projectId),
    knowledgeDocs: knowledgeDocs.filter((doc) => doc.projectId === projectId),
    handovers: handovers.filter((handover) => handover.projectId === projectId),
    deployments: deployments.filter((deployment) => deployment.projectId === projectId),
    artifacts: artifacts.filter((artifact) => artifact.projectId === projectId),
    agents: agents.filter((agent) => agent.projectIds.includes(projectId)),
  };
}

export function byStatus(projectTasks: Task[]) {
  const statuses: TaskStatus[] = ["Todo", "In Progress", "In Review", "Blocked", "Done"];
  return statuses.map((status) => ({
    status,
    tasks: projectTasks.filter((task) => task.status === status),
  }));
}
