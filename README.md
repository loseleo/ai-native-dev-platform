# AI Native Dev Platform

Boss-driven AI Native Software Company OS demo built with Next.js, TypeScript, and TailwindCSS.

## Current IA

Global navigation is intentionally small:

- Dashboard
- Projects
- AI Organization
- Decision Inbox
- Settings / Setup

Project delivery modules live inside Project Workspace:

- `/projects/[projectId]`
- `/projects/[projectId]/tasks`
- `/projects/[projectId]/bugs`
- `/projects/[projectId]/reviews`
- `/projects/[projectId]/decisions`
- `/projects/[projectId]/memory`
- `/projects/[projectId]/knowledge`
- `/projects/[projectId]/handover`
- `/projects/[projectId]/deployments`
- `/projects/[projectId]/artifacts`

## Development

```bash
pnpm install
cp .env.example .env.local
pnpm prisma:generate
pnpm prisma:migrate:mysql
pnpm prisma:seed
pnpm dev
```

Open `http://localhost:3000`.

## Notes

The workspace IA currently uses typed seed data in `src/lib/data.ts`.

Setup/Auth/database groundwork is in place:

- Prisma MySQL schema: `prisma/schema.prisma`
- Prisma Vercel Postgres schema: `prisma/schema.postgres.prisma`
- Auth.js Credentials route: `/api/auth/[...nextauth]`
- Setup wizard: `/setup`

Local bootstrap expects MySQL through `DATABASE_URL`. Sensitive setup fields require `APP_ENCRYPTION_KEY` and are encrypted before being saved.
