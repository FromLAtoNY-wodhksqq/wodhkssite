"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signup") {
      if (password !== passwordConfirm) {
        setError("비밀번호가 일치하지 않습니다.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "가입에 실패했습니다.");
        setLoading(false);
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-[15px] text-white placeholder-white/45 outline-none backdrop-blur-xl transition focus:border-white/40 focus:bg-white/15";

  return (
    <div
      className="relative flex h-dvh flex-col items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url(/login-bg.jpg)" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />

      <form
        onSubmit={handleSubmit}
        className="relative flex w-full max-w-[360px] flex-col gap-3 rounded-[28px] border border-white/15 bg-white/10 p-8 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
      >
        <h1 className="mb-2 text-center text-[22px] font-semibold tracking-tight text-white">
          {mode === "login" ? "로그인" : "계정 만들기"}
        </h1>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          required
          className={inputClass}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          required
          minLength={8}
          className={inputClass}
        />
        {mode === "signup" && (
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호 확인"
            required
            minLength={8}
            className={inputClass}
          />
        )}

        {error && (
          <p className="text-center text-[13px] text-red-300">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-white py-3 text-[15px] font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
        >
          {mode === "login" ? "로그인" : "가입하기"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
            setPasswordConfirm("");
          }}
          className="mt-1 text-center text-[13px] text-white/60 transition hover:text-white/90"
        >
          {mode === "login"
            ? "계정이 없나요? 회원가입"
            : "이미 계정이 있나요? 로그인"}
        </button>
      </form>
    </div>
  );
}
