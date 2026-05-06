"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const result = await signIn("credentials", {
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          redirect: true,
          callbackUrl: "/dashboard",
        });

        if (result?.error) {
          setError("账号或密码不正确。");
          setLoading(false);
        }
      }}
    >
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="email">
          Boss Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500"
          placeholder="boss@example.com"
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500"
          placeholder="At least 8 characters"
        />
      </div>
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}
      <button className="h-11 w-full rounded-md bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800" type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign in as Boss"}
      </button>
    </form>
  );
}
