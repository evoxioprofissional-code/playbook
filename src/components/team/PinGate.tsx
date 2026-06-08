"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Delete, ShieldCheck, UserRound, Mail } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { fetchEmployees, signInEmail, type Employee } from "@/lib/store";
import { useSession } from "./session";

export default function PinGate({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { login } = useSession();
  const [mode, setMode] = useState<"pin" | "email">("pin");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  // Login por e-mail
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (open) fetchEmployees().then(setEmployees);
  }, [open]);

  const reset = () => {
    setSelected(null);
    setPin("");
    setError(false);
    setMode("pin");
    setEmail("");
    setPassword("");
    setAuthErr("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const press = (d: string) => {
    setError(false);
    setPin((p) => (p.length >= 4 ? p : p + d));
  };

  useEffect(() => {
    if (!selected || pin.length !== 4) return;
    if (pin === selected.pin) {
      login({
        id: selected.id,
        name: selected.name,
        role: selected.role,
        areas: selected.areas ?? null,
      });
      close();
    } else {
      setError(true);
      setTimeout(() => setPin(""), 350);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  async function loginEmail() {
    if (!email.trim() || !password) return;
    setAuthLoading(true);
    setAuthErr("");
    const r = await signInEmail(email, password);
    setAuthLoading(false);
    if (!r.ok) {
      setAuthErr(
        r.error === "Email not confirmed"
          ? "E-mail ainda não confirmado no Supabase (desative a confirmação)."
          : "E-mail ou senha incorretos."
      );
      return;
    }
    login({ id: r.user!.id, name: r.user!.name, role: "gestor", areas: null });
    close();
  }

  const title =
    mode === "email"
      ? "Entrar como Admin"
      : selected
        ? `PIN de ${selected.name}`
        : "Quem está usando?";

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      subtitle={
        mode === "email"
          ? "Acesso do gestor por e-mail e senha."
          : selected
            ? "Digite seu PIN de 4 dígitos."
            : "Funcionário entra com PIN; admin entra com e-mail."
      }
    >
      {/* Alternância de modo (só quando não está digitando PIN) */}
      {!selected && (
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-ink-800 p-1">
          <button
            onClick={() => setMode("pin")}
            className={`rounded-lg py-2 text-xs font-bold transition ${
              mode === "pin" ? "bg-flame-500 text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Funcionário (PIN)
          </button>
          <button
            onClick={() => setMode("email")}
            className={`rounded-lg py-2 text-xs font-bold transition ${
              mode === "email" ? "bg-flame-500 text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Admin (e-mail)
          </button>
        </div>
      )}

      {mode === "email" ? (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              E-mail
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="pg-inp"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Senha
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loginEmail()}
              placeholder="••••••••"
              className="pg-inp"
            />
          </label>
          {authErr && <p className="text-xs font-semibold text-rose-400">{authErr}</p>}
          <button
            onClick={loginEmail}
            disabled={!email.trim() || !password || authLoading}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
              email.trim() && password && !authLoading
                ? "bg-flame-500 text-black hover:bg-flame-400"
                : "cursor-not-allowed bg-ink-700 text-zinc-500"
            }`}
          >
            <Mail size={16} /> {authLoading ? "Entrando…" : "Entrar"}
          </button>

          <style jsx>{`
            :global(.pg-inp) {
              width: 100%;
              border-radius: 0.6rem;
              border: 1px solid #26262c;
              background: #0a0a0b;
              padding: 0.6rem 0.75rem;
              font-size: 0.9rem;
              color: #f4f4f5;
              outline: none;
            }
            :global(.pg-inp:focus) {
              border-color: #ff6b1a;
            }
          `}</style>
        </div>
      ) : !selected ? (
        <ul className="space-y-2">
          {employees.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => setSelected(e)}
                className="flex w-full items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 px-3 py-3 text-left transition hover:border-flame-500/40"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 text-flame-400">
                  {e.role === "gestor" ? <ShieldCheck size={18} /> : <UserRound size={18} />}
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">{e.name}</span>
                  <span className="block text-[11px] uppercase tracking-wide text-zinc-500">
                    {e.role}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <div className="mb-4 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-3.5 w-3.5 rounded-full transition ${
                  error ? "bg-rose-500" : pin.length > i ? "bg-flame-500" : "bg-ink-700"
                }`}
              />
            ))}
          </div>
          {error && (
            <p className="mb-3 text-center text-xs font-semibold text-rose-400">
              PIN incorreto. Tente de novo.
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <Key key={d} onClick={() => press(d)}>
                {d}
              </Key>
            ))}
            <button
              onClick={() => setSelected(null)}
              className="rounded-xl bg-ink-800 py-3 text-xs font-bold text-zinc-400 hover:text-white"
            >
              Voltar
            </button>
            <Key onClick={() => press("0")}>0</Key>
            <button
              onClick={() => setPin((p) => p.slice(0, -1))}
              className="flex items-center justify-center rounded-xl bg-ink-800 py-3 text-zinc-400 hover:text-white"
              aria-label="Apagar"
            >
              <Delete size={18} />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Key({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-ink-800 py-3 text-lg font-extrabold text-white transition hover:bg-ink-700 active:scale-95"
    >
      {children}
    </button>
  );
}
