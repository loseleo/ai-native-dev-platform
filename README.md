# AI Native Dev Platform

An open-source AI delivery operating system for turning web product ideas into trackable, reviewable, and deployable software work.

AI Native Dev Platform is built for teams that want to manage AI agents like a real software organization: one Boss account, a global agent pool, project workspaces, requirements, tasks, decisions, memory, artifacts, GitHub handoff, and Vercel deployment tracking.

> Status: early alpha. The product already includes the core platform shell, project workspace IA, authentication, setup flow, database-backed writes, AI delivery run tracking, and protected GitHub/Vercel integration paths. Real autonomous coding is intentionally gated by Boss approval.

## Why This Exists

Most AI coding workflows are powerful but hard to operate as a system. The missing layer is not another chat box. It is an operational control plane:

- What requirement is the AI working on?
- Which agent owns planning, engineering, QA, or review?
- What did the AI decide, generate, fail, retry, and hand over?
- Which human approval gate blocks code, PR creation, or deployment?
- Where are the PRD, technical plan, QA checklist, deployment URL, and memory trail?

This project explores that control plane.

## Core Capabilities

- Boss-first workspace: a single accountable operator controls setup, approvals, and delivery gates.
- Project Workspace: each project owns its Tasks, Bugs, Reviews, Decisions, Memory, Knowledge Base, Handover, Deployments, Artifacts, Agents, Activity, and Requirements.
- AI Organization: manage global agents, provider source, model, capabilities, lifecycle, and API key configuration per agent.
- Requirement to delivery run: create web requirements, generate AI planning runs, approve plans, generate code change packages, create PR-ready artifacts, sync deployments, and mark acceptance.
- Audit and memory: ledger events, snapshots, compressed context, run steps, linked objects, and delivery history.
- GitHub integration path: protected PR package creation after Boss approval.
- Vercel integration path: project/team config, deployment records, preview URLs, build status, and logs URL tracking.
- Secure setup: Auth.js credentials, encrypted sensitive config, setup/login guards, and read-only seed demo mode.
- Table-first admin UI: dense backend layout with left-side menu tree and project workspace navigation.

## Product Model

The platform keeps global pages intentionally small:

- Dashboard: cross-project health, blocking decisions, and executive summary.
- Projects: project list, creation entry, health, and workspace access.
- AI Organization: global agent pool and lifecycle.
- Decision Inbox: Boss pending/blocking decisions across projects.
- Settings: Boss account, database, Vercel, GitHub, encryption, and integration checks.

All delivery details live inside a Project Workspace:

```text
/projects/[projectId]
/projects/[projectId]/requirements
/projects/[projectId]/tasks
/projects/[projectId]/bugs
/projects/[projectId]/reviews
/projects/[projectId]/decisions
/projects/[projectId]/memory
/projects/[projectId]/knowledge
/projects/[projectId]/handover
/projects/[projectId]/deployments
/projects/[projectId]/artifacts
/projects/[projectId]/agents
/projects/[projectId]/activity
```

## AI Delivery Flow

The current v1 flow is semi-automatic by design:

1. Boss creates a project with repository, Vercel, and database context.
2. Boss configures project agents and each agent's provider/model/API key.
3. Boss creates a web requirement such as a todolist, pomodoro timer, dashboard, or internal tool.
4. PM Agent generates PRD, scope, tasks, and acceptance criteria.
5. RD Agent generates technical plan and code change plan.
6. Boss approves the plan before code packaging.
7. The platform creates a protected GitHub PR package or records a blocking decision if GitHub is not configured.
8. Vercel preview deployment status and URL are recorded.
9. QA checklist, artifacts, activity, and memory timeline are updated.
10. Boss accepts or sends the work back.

No production deploy or main-branch merge happens silently.

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Prisma
- Auth.js Credentials
- MySQL-compatible local schema
- Postgres/Vercel/Supabase-compatible deployment schema
- Node test runner

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- A database URL for writable mode
- `APP_ENCRYPTION_KEY` for saving sensitive configuration

### Install

```bash
pnpm install
cp .env.example .env.local
```

Update `.env.local` before running setup:

```bash
DATABASE_URL="mysql://user:password@localhost:3306/ai_native_dev"
APP_ENCRYPTION_KEY="replace-with-a-long-random-encryption-key"
AUTH_SECRET="replace-with-a-long-random-auth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Generate Prisma Client:

```bash
pnpm prisma:generate
```

For local MySQL development:

```bash
pnpm prisma:migrate:mysql
pnpm prisma:seed
```

For Postgres deployment schema:

```bash
pnpm exec prisma generate --schema prisma/schema.postgres.prisma
pnpm prisma:migrate:postgres
```

Start the app:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Demo Mode

If no database is configured, the platform can still render seed demo data. Write actions are intentionally unavailable in demo mode so the UI does not pretend to save data.

## Configuration Philosophy

Global Settings should only store platform-level setup and integrations:

- Boss account
- Database configuration
- Vercel integration
- GitHub integration
- Encryption status

AI provider keys belong to individual agents. This keeps cost, access, and execution responsibility explicit:

```text
Agent provider + model + key -> AI delivery execution
```

There is no global fallback AI key by design.

## Useful Commands

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Prisma helpers:

```bash
pnpm prisma:generate
pnpm prisma:migrate:mysql
pnpm prisma:migrate:postgres
pnpm prisma:seed
pnpm prisma:studio
```

## Roadmap

- Real provider adapters for GPT, Gemini, Claude, and MiniMax structured generation.
- GitHub branch, commit, and draft PR creation from approved code packages.
- Vercel deployment status polling and richer build log surfacing.
- Agent run detail pages with retry, failure analysis, and handover summaries.
- Better project templates for web apps, internal tools, landing pages, dashboards, and AI workflows.
- More tests around server actions, ledger writes, auth guards, and deployment readiness.
- Optional local SQLite profile for fast private demos.
- Playwright smoke tests for setup, login, project creation, requirements, and agent configuration.

## Contributing

Contributions are welcome. This project is especially interested in contributors who care about:

- AI agent orchestration
- Developer tools
- Product operations
- Workflow automation
- Next.js admin UI
- Prisma schema design
- GitHub and Vercel integrations
- Secure handling of model/API credentials

Good first contribution areas:

- Improve empty states, table filters, and project workspace UX.
- Add focused tests for server actions and ledger events.
- Build provider adapters behind the existing execution boundary.
- Improve documentation for setup, deployment, and agent configuration.
- Add templates for common web requirements such as todolist, pomodoro, CRM, dashboard, and docs portal.

Before opening a pull request:

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Please keep changes focused and avoid committing secrets, `.env.local`, generated credentials, database dumps, or private deployment tokens.

## Security

Sensitive values must be encrypted before storage. Do not add global AI provider keys or plaintext tokens to source code, tests, seed data, screenshots, or documentation.

If you find a security issue, please do not disclose it publicly before maintainers have had a chance to respond.

## License

License is not finalized yet. If you plan to use this project seriously or contribute a substantial change, please open an issue to discuss the intended open-source license.
