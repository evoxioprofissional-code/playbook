"use client";

import { useState, type ReactNode } from "react";
import { Mail, LogIn, ShieldCheck } from "lucide-react";
import { signInEmail } from "@/lib/store";
import { useSession } from "./session";

export default function LoginScreen({ admin = false }: { admin?: boolean }) {
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setErr("");
    const r = await signInEmail(email, password);
    setLoading(false);
    if (!r.ok) {
      setErr(r.error || "Não foi possível entrar.");
      return;
    }
    if (admin && r.user!.role !== "gestor") {
      setErr("Este acesso é só para o gestor.");
      return;
    }
    login({
      id: r.user!.id,
      name: r.user!.name,
      role: r.user!.role,
      areas: r.user!.areas ?? null,
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 bg-grain p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-flame-500 to-gold-500 text-lg font-black text-black shadow-glow">
            J2A
          </div>
          <p className="mt-3 text-lg font-extrabold uppercase tracking-wide text-white">
            Sales Machine
          </p>
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-flame-400">
            {admin && <ShieldCheck size={12} />}
            {admin ? "Painel do administrador" : "Entre para continuar"}
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-ink-700 bg-ink-900/80 p-5">
          <Field label="E-mail">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
              className="ls-inp"
            />
          </Field>
          <Field label="Senha">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••••"
              autoComplete="current-password"
              className="ls-inp"
            />
          </Field>
          {err && <p className="text-xs font-semibold text-rose-400">{err}</p>}
          <button
            onClick={submit}
            disabled={!email.trim() || !password || loading}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
              email.trim() && password && !loading
                ? "bg-flame-500 text-black hover:bg-flame-400"
                : "cursor-not-allowed bg-ink-700 text-zinc-500"
            }`}
          >
            {admin ? <ShieldCheck size={16} /> : <LogIn size={16} />}
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </div>
        <p className="mt-4 text-center text-[11px] text-zinc-600">
          Fábrica J2A Bonés · Seridó
        </p>
      </div>

      <style jsx>{`
        :global(.ls-inp) {
          width: 100%;
          border-radius: 0.6rem;
          border: 1px solid #26262c;
          background: #0a0a0b;
          padding: 0.6rem 0.75rem;
          font-size: 0.9rem;
          color: #f4f4f5;
          outline: none;
        }
        :global(.ls-inp:focus) {
          border-color: #ff6b1a;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}
