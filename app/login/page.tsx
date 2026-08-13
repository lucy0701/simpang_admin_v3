import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "로그인 · Playground Admin",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // Next 16 에서 searchParams 는 Promise 다.
  const { next } = await searchParams;
  const redirectTo = typeof next === "string" ? next : "/dashboard";

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold">SimPang Admin</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Login as an operator account.
        </p>
        <LoginForm next={redirectTo} />
      </div>
    </main>
  );
}
