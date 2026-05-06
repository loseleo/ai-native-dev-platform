import type { ReactNode } from "react";

export function AuthShell({ children, label }: { children: ReactNode; label: string }) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-cyan-700">{label}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">AI Native Dev Platform</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            First-run setup and Boss login stay outside the operational workspace, so the backend navigation only appears after the system is ready.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
