import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projectId = "web-os";

async function main() {
  await prisma.$transaction([
    prisma.artifact.deleteMany(),
    prisma.deployment.deleteMany(),
    prisma.handoverPackage.deleteMany(),
    prisma.knowledgeDocument.deleteMany(),
    prisma.review.deleteMany(),
    prisma.bug.deleteMany(),
    prisma.ledgerEvent.deleteMany(),
    prisma.decision.deleteMany(),
    prisma.task.deleteMany(),
    prisma.projectAgent.deleteMany(),
    prisma.agent.deleteMany(),
    prisma.project.deleteMany(),
  ]);

  await prisma.project.create({
    data: {
      id: projectId,
      name: "AI Native Dev Platform",
      type: "WEB",
      stage: "DEVELOPMENT",
      health: "AT_RISK",
      progress: 58,
      goal: "让 Boss 像管理一家 AI 软件公司一样管理 Web 项目交付。",
      targetUsers: "Founder, Product Lead, Engineering Manager",
      repo: "loseleo/ai-native-dev-platform",
      previewUrl: "https://ai-native-dev-platform.vercel.app",
      nextActions: ["Approve Tech trade-off", "Review QA case readiness", "Assign independent RD handover"].join("\n"),
      tasks: {
        create: [
          {
            id: "TASK-101",
            title: "Setup Wizard 信息架构",
            type: "Development",
            stage: "DEVELOPMENT",
            team: "RD",
            owner: "Nova",
            reviewer: "Kai",
            status: "IN_PROGRESS",
            priority: "P0",
            deliverable: "Setup route + encrypted config form",
            acceptance: "未初始化时强制进入 Setup，完成后进入登录页。",
          },
          {
            id: "TASK-102",
            title: "Project Workspace 导航收敛",
            type: "Development",
            stage: "DEVELOPMENT",
            team: "RD",
            owner: "Nova",
            reviewer: "Kai",
            status: "IN_REVIEW",
            priority: "P0",
            deliverable: "Nested workspace routes",
            acceptance: "Tasks/Bugs/Memory/Docs 都位于项目上下文内。",
          },
          {
            id: "TASK-104",
            title: "Boss Decision Card",
            type: "Review",
            stage: "TECH_REVIEW",
            team: "PM",
            owner: "Mira",
            reviewer: "Boss",
            status: "BLOCKED",
            priority: "P0",
            deliverable: "Decision card with options",
            acceptance: "阻塞项必须聚合到全局 Decision Inbox。",
          },
        ],
      },
      decisions: {
        create: [
          {
            id: "DEC-31",
            title: "本地 MySQL 与线上 Postgres 的 Prisma 策略",
            raisedBy: "Kai",
            owner: "Boss",
            type: "Technical trade-off",
            status: "PENDING",
            blocking: true,
            recommendation: "使用双 schema，模型保持一致。",
            impact: "影响 migration 脚本和部署文档。",
          },
        ],
      },
      bugs: {
        create: [
          {
            id: "BUG-12",
            title: "移动端 Kanban 列宽导致横向溢出",
            severity: "P1",
            status: "FIXING",
            owner: "Nova",
            reproduction: "在 390px 宽度打开任务页，拖动区域超出视口。",
          },
        ],
      },
      reviews: {
        create: [
          {
            id: "REV-1",
            type: "PRD",
            owner: "Mira",
            result: "PASS",
            summary: "PRD 覆盖 Boss、AI Organization、Workflow、Memory、Handover。",
          },
        ],
      },
      ledger: {
        create: [
          {
            id: "LED-1",
            title: "Project created",
            detail: "Boss created Web project and assigned PM Lead.",
          },
          {
            id: "LED-2",
            title: "Tech trade-off escalated",
            detail: "RD Lead escalated database provider strategy to Boss.",
          },
        ],
      },
      knowledgeDocuments: {
        create: [
          { id: "DOC-1", filename: "product.md", title: "Product Brief", summary: "Boss-driven AI Native Software Company OS." },
          { id: "DOC-2", filename: "prd.md", title: "Approved PRD", summary: "Web project delivery demo with workflow, task, decision, memory." },
          { id: "DOC-3", filename: "architecture.md", title: "Architecture", summary: "Next.js App Router, Auth.js, Prisma, MySQL local, Postgres online." },
        ],
      },
      handovers: {
        create: [
          {
            id: "HND-7",
            fromAgent: "Kai",
            toAgent: "Nova",
            status: "ACCEPTED",
            objective: "Implement Project Workspace shell and route structure.",
            scope: "Navigation, overview, tasks, bugs, memory, knowledge, deployments.",
          },
        ],
      },
      deployments: {
        create: [
          {
            id: "DEP-1",
            environment: "PREVIEW",
            status: "READY",
            url: "https://ai-native-dev-platform-git-dev.vercel.app",
            branch: "dev",
          },
        ],
      },
      artifacts: {
        create: [
          { id: "ART-1", name: "AI Native Dev Platform PRD", type: "PRD", owner: "Mira", status: "APPROVED" },
          { id: "ART-2", name: "Workspace IA Design Notes", type: "Design", owner: "Lena", status: "APPROVED" },
        ],
      },
    },
  });

  const agents = [
    { id: "pm-lead", name: "Mira", team: "PM", role: "PM Lead", status: "WORKING", capabilities: "PRD\nUser Story\nAcceptance" },
    { id: "rd-lead", name: "Kai", team: "RD", role: "RD Lead", status: "WORKING", capabilities: "Architecture\nCode Review\nBranch Strategy" },
    { id: "rd-1", name: "Nova", team: "RD", role: "RD Agent", status: "BLOCKED", capabilities: "Next.js\nPrisma\nAPI" },
    { id: "qa-lead", name: "Iris", team: "QA", role: "QA Lead", status: "IDLE", capabilities: "Test Strategy\nBug Triage" },
    { id: "ux-lead", name: "Lena", team: "UI/UX", role: "UI/UX Lead", status: "PAUSED", capabilities: "Design Review\nInteraction Flow" },
  ];

  for (const agent of agents) {
    await prisma.agent.create({
      data: {
        ...agent,
        projectAgents: {
          create: { projectId },
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
