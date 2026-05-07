import type { ProjectStage } from "@/lib/data";

export const globalNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/ai-organization", label: "AI Organization" },
  { href: "/decision-inbox", label: "Decision Inbox" },
  { href: "/settings", label: "Settings" },
];

export const workspaceNavItems = [
  { href: "", label: "Overview", hint: "Snapshot and workflow" },
  { href: "/requirements", label: "Requirements", hint: "AI delivery intake" },
  { href: "/tasks", label: "Tasks", hint: "Delivery work" },
  { href: "/bugs", label: "Bugs", hint: "QA issue tracking" },
  { href: "/reviews", label: "Reviews", hint: "Quality gates" },
  { href: "/decisions", label: "Decisions", hint: "Boss approvals" },
  { href: "/memory", label: "Memory", hint: "Ledger and context" },
  { href: "/activity", label: "Activity", hint: "Agent run log" },
  { href: "/knowledge", label: "Knowledge Base", hint: "Project docs" },
  { href: "/handover", label: "Handover", hint: "Agent briefs" },
  { href: "/deployments", label: "Deployments", hint: "Release status" },
  { href: "/artifacts", label: "Artifacts", hint: "Delivery outputs" },
  { href: "/agents", label: "Agents", hint: "Project members" },
];

export function getWorkflowModule(stage: ProjectStage) {
  if (stage.includes("Bug")) {
    return "bugs";
  }

  if (stage.includes("QA") || stage.includes("Review") || stage.includes("Approval") || stage.includes("Acceptance")) {
    return "reviews";
  }

  if (stage.includes("Deploy")) {
    return "deployments";
  }

  if (stage.includes("Development") || stage.includes("Code")) {
    return "tasks";
  }

  return "knowledge";
}

export function getNextActionModule(action: string) {
  const normalized = action.toLowerCase();

  if (normalized.includes("decision") || normalized.includes("approve")) {
    return "decisions";
  }

  if (normalized.includes("qa") || normalized.includes("review")) {
    return "reviews";
  }

  if (normalized.includes("handover") || normalized.includes("onboard")) {
    return "handover";
  }

  if (normalized.includes("deploy") || normalized.includes("preview")) {
    return "deployments";
  }

  return "tasks";
}
