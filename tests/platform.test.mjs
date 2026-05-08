import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

test("proxy protects backend routes when database mode is enabled", () => {
  const source = read("src/proxy.ts");

  assert.match(source, /DATABASE_URL/);
  assert.match(source, /next-auth\.session-token/);
  assert.match(source, /NextResponse\.redirect/);
});

test("workspace navigation exposes agent activity tracking", () => {
  const source = read("src/lib/navigation.ts");

  assert.match(source, /Activity/);
  assert.match(source, /\/activity/);
});

test("settings supports mutable boss and integration configuration", () => {
  const setupSource = read("src/lib/setup.ts");
  const pageSource = read("src/app/settings/page.tsx");

  assert.match(setupSource, /updateBossAccount/);
  assert.match(setupSource, /updateIntegrationConfigs/);
  assert.match(pageSource, /Update Boss/);
  assert.match(pageSource, /Update Config/);
});

test("create dialog supports keyboard and backdrop close", () => {
  const source = read("src/components/create-dialog.tsx");

  assert.match(source, /Escape/);
  assert.match(source, /aria-modal/);
  assert.match(source, /onMouseDown/);
});

test("activity page includes runtime and ledger views", () => {
  const source = read("src/app/projects/[projectId]/activity/page.tsx");

  assert.match(source, /Agent Run Log/);
  assert.match(source, /Runtime Defaults/);
  assert.match(source, /Activity Timeline/);
});

test("project and agent schemas store delivery and model configuration", () => {
  const postgresSchema = read("prisma/schema.postgres.prisma");
  const mysqlSchema = read("prisma/schema.prisma");
  const actions = read("src/lib/workspace-actions.ts");
  const projectsPage = read("src/app/projects/page.tsx");
  const deploymentsPage = read("src/app/projects/[projectId]/deployments/page.tsx");

  for (const schema of [postgresSchema, mysqlSchema]) {
    assert.match(schema, /gitProvider/);
    assert.match(schema, /vercelProject/);
    assert.match(schema, /databaseUrl/);
    assert.match(schema, /provider\s+String\s+@default\("gpt"\)/);
    assert.match(schema, /apiKey/);
    assert.match(schema, /availability\s+String\s+@default\("ONLINE"\)/);
    assert.match(schema, /systemPrompt/);
    assert.match(schema, /userPrompt/);
    assert.match(schema, /summary\s+String\?/);
  }

  assert.match(actions, /encryptedOptional/);
  assert.match(actions, /parseGitRepository/);
  assert.match(actions, /parseVercelProjectUrl/);
  assert.match(actions, /updateProjectDeploymentConfig/);
  assert.doesNotMatch(projectsPage, /Vercel Project URL/);
  assert.match(projectsPage, /Vercel project binding happens later/);
  assert.match(deploymentsPage, /Configure Vercel Project/);
  assert.match(actions, /gemini/);
  assert.match(actions, /minimax/);
  assert.match(actions, /claude/);
});

test("project agents are assigned, released, and stopped from the workspace", () => {
  const agentsPage = read("src/app/projects/[projectId]/agents/page.tsx");
  const actions = read("src/lib/workspace-actions.ts");

  assert.match(agentsPage, /Assign Idle Agent/);
  assert.match(agentsPage, /releaseProjectAgent/);
  assert.match(agentsPage, /forceStopProjectAgent/);
  assert.doesNotMatch(agentsPage, /updateGlobalAgent/);
  assert.doesNotMatch(agentsPage, /apiKey/);
  assert.match(actions, /Only online and idle agents/);
  assert.match(actions, /Agent released/);
  assert.match(actions, /Agent force stopped/);
});

test("ai delivery flow has requirements, runs, code changes, and approval actions", () => {
  const schema = read("prisma/schema.postgres.prisma");
  const actions = read("src/lib/workspace-actions.ts");
  const requirementsPage = read("src/app/projects/[projectId]/requirements/page.tsx");
  const activityPage = read("src/app/projects/[projectId]/activity/page.tsx");
  const settings = read("src/app/settings/page.tsx");

  assert.match(schema, /model Requirement/);
  assert.match(schema, /model AgentRun/);
  assert.match(schema, /model AgentRunStep/);
  assert.match(schema, /model CodeChange/);
  assert.match(schema, /objectType/);
  assert.match(actions, /createRequirementFromPrompt/);
  assert.match(actions, /planRequirementWithAI/);
  assert.match(actions, /approveRunPlan/);
  assert.match(actions, /generateCodePatch/);
  assert.match(actions, /approveAndCreatePullRequest/);
  assert.match(actions, /syncVercelDeployment/);
  assert.match(actions, /markRequirementAccepted/);
  assert.doesNotMatch(actions, /AI_PROVIDER/);
  assert.match(actions, /createGitHubPrPackage/);
  assert.match(actions, /GITHUB/);
  assert.match(actions, /readLatestVercelDeployment/);
  assert.match(actions, new RegExp("v13/deployments"));
  assert.match(requirementsPage, /Start AI Delivery/);
  assert.match(requirementsPage, /PM Planning/);
  assert.match(activityPage, /Run Steps/);
  assert.doesNotMatch(settings, /Global GPT API key/);
  assert.match(settings, /GitHub token/);
});

test("organization owns agent prompts while project tasks use boss approval gates", () => {
  const organization = read("src/app/ai-organization/page.tsx");
  const tasksPage = read("src/app/projects/[projectId]/tasks/page.tsx");
  const actions = read("src/lib/workspace-actions.ts");

  assert.match(organization, /System Prompt/);
  assert.match(organization, /User Prompt/);
  assert.match(organization, /Availability/);
  assert.doesNotMatch(organization, /Capabilities/);
  assert.match(tasksPage, /Boss Gate/);
  assert.match(tasksPage, /reviewTaskApproval/);
  assert.doesNotMatch(tasksPage, /Create Task/);
  assert.match(actions, /Boss Task Gate/);
});

test("ai delivery smoke prompts cover todolist and pomodoro website delivery", () => {
  const source = read("src/lib/ai-delivery.ts");

  assert.match(source, /deliveryStateFlow/);
  assert.match(source, /Draft/);
  assert.match(source, /Planned/);
  assert.match(source, /Code Ready/);
  assert.match(source, /PR Ready/);
  assert.match(source, /Deployed/);
  assert.match(source, /Accepted/);
  assert.match(source, /Todolist Web App/);
  assert.match(source, /Pomodoro Timer Web App/);
  assert.match(source, /start, pause, reset/);
  assert.match(source, /completed session count/);
});
