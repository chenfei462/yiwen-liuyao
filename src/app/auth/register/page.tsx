"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          anonymous_id: window.localStorage.getItem("yiwen-liuyao-anonymous-id") ?? undefined,
        }),
      });
      if (!response.ok) throw new Error("注册失败，请换一个邮箱或稍后再试");
      router.replace(searchParams.get("next") || "/");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "注册失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f0e6] px-4 text-[#171814]">
      <form onSubmit={submitRegistration} className="w-full max-w-sm rounded-lg border border-[#2f3b2f]/15 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">创建账号</h1>
        <label className="mt-5 block text-sm font-medium">
          邮箱
          <input className="mt-2 w-full rounded-md border border-[#2f3b2f]/20 px-3 py-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="mt-4 block text-sm font-medium">
          密码
          <input className="mt-2 w-full rounded-md border border-[#2f3b2f]/20 px-3 py-2" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error ? <p className="mt-3 text-sm text-[#9f2d20]">{error}</p> : null}
        <button className="mt-5 h-10 w-full rounded-md bg-[#245f46] px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} type="submit">
          {isSubmitting ? "创建中" : "注册并继续"}
        </button>
        <button className="mt-3 h-10 w-full rounded-md border border-[#2f3b2f]/20 px-4 text-sm font-semibold" type="button" onClick={() => router.push(`/auth/login?next=${encodeURIComponent(searchParams.get("next") || "/")}`)}>
          已有账号登录
        </button>
      </form>
    </main>
  );
}
