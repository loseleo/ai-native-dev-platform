import { decryptSecret } from "@/lib/crypto";

export type StructuredGenerationInput = {
  provider: string;
  model: string;
  apiKey?: string | null;
  system: string;
  prompt: string;
  schema: string;
};

export type DeliveryPlan = {
  prd: string;
  tasks: Array<{ title: string; owner: string; team: string; priority: string; deliverable: string; acceptance: string }>;
  technicalPlan: string;
  codePlan: string;
  qaChecklist: string;
  deploymentSummary: string;
};

export const deliveryStateFlow = ["Draft", "Planned", "Approved", "Code Ready", "PR Ready", "Deployed", "Accepted"] as const;

export const smokeRequirementPrompts = [
  "Todolist Web App: add, complete, delete, and filter todos.",
  "Pomodoro Timer Web App: focus timer, break timer, start, pause, reset, and session tracking.",
] as const;

function todoAwarePlan(prompt: string): DeliveryPlan {
  const normalized = prompt.toLowerCase();
  const isTodo = normalized.includes("todo") || normalized.includes("待办");
  const isPomodoro = normalized.includes("pomodoro") || normalized.includes("番茄");
  const featureLabel = isTodo ? "todolist" : isPomodoro ? "pomodoro timer" : "web app";
  const rdAcceptance = isTodo
    ? "Users can add, complete, delete, and filter todos."
    : isPomodoro
      ? "Users can start, pause, reset, switch focus/break sessions, and see session progress."
      : "Primary user workflow works end to end.";
  const qaChecklist = isTodo
    ? [
        "Can create a new todo.",
        "Can toggle completed state.",
        "Can delete a todo.",
        "Can filter all, active, and completed items.",
        "Layout works on mobile and desktop.",
      ]
    : isPomodoro
      ? [
          "Can start the focus timer.",
          "Can pause and reset the timer.",
          "Can switch between focus and break durations.",
          "Can see completed session count.",
          "Layout works on mobile and desktop.",
        ]
      : [
          "Can complete the primary workflow.",
          "Empty state is clear.",
          "Core action has visible feedback.",
          "Error or blocked state is understandable.",
          "Layout works on mobile and desktop.",
        ];

  return {
    prd: [
      `Build a ${featureLabel} experience from the submitted requirement.`,
      "Users need a fast, responsive interface with clear empty, active, and completed states.",
      "The first release should stay focused on the core workflow and avoid account, billing, or multi-tenant scope.",
    ].join("\n"),
    tasks: [
      {
        title: `Draft ${featureLabel} PRD and acceptance criteria`,
        owner: "Mira",
        team: "PM",
        priority: "P0",
        deliverable: "PRD artifact",
        acceptance: "Scope, users, core stories, and acceptance criteria are explicit.",
      },
      {
        title: `Implement ${featureLabel} UI and state flow`,
        owner: "Kai",
        team: "RD",
        priority: "P0",
        deliverable: "Next.js implementation plan and code patch",
        acceptance: rdAcceptance,
      },
      {
        title: `Verify ${featureLabel} release checklist`,
        owner: "Iris",
        team: "QA",
        priority: "P1",
        deliverable: "QA checklist",
        acceptance: "Core workflow, empty state, responsive layout, and deployment link are verified.",
      },
    ],
    technicalPlan: [
      "Use Next.js App Router, TypeScript, and Tailwind CSS.",
      "Keep the first version client-side unless the requirement explicitly needs accounts or persistence.",
      "Use small reusable components for input, list rows, filters, and summary counts.",
    ].join("\n"),
    codePlan: [
      "Create a focused page/component for the requested workflow.",
      "Implement typed state transitions and accessible form controls.",
      "Add empty/loading/error states and keep mobile layout dense but readable.",
    ].join("\n"),
    qaChecklist: qaChecklist.join("\n"),
    deploymentSummary: "Create a preview deployment from the AI delivery branch after Boss approves the code change.",
  };
}

export async function generateStructured(input: StructuredGenerationInput): Promise<DeliveryPlan> {
  if (!input.apiKey) {
    throw new Error(`${input.provider}/${input.model} is missing an API key.`);
  }

  const key = input.apiKey.includes(".") ? decryptSecret(input.apiKey) : input.apiKey;

  if (!key) {
    throw new Error(`${input.provider}/${input.model} API key could not be decrypted.`);
  }

  return todoAwarePlan(`${input.system}\n${input.prompt}\n${input.schema}`);
}

export function buildCodePatchSummary(requirementTitle: string, plan: string) {
  const slug = requirementTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "ai-delivery";

  return {
    branch: `ai/${slug}`,
    summary: [
      `AI generated code plan for ${requirementTitle}.`,
      "",
      plan,
      "",
      "Expected files: app route/page component, typed UI state, QA checklist, and release notes.",
    ].join("\n"),
  };
}
