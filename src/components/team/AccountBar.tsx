"use client";

import { useState } from "react";
import { LogIn, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useSession } from "./session";
import PinGate from "./PinGate";

export default function AccountBar() {
  const { user, ready, logout } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <>
      {!ready ? (
        <div className="h-10 animate-pulse rounded-xl bg-ink-800" />
      ) : user ? (
        <div className="flex items-center gap-2.5 rounded-xl bg-ink-800 px-3 py-2.5 ring-1 ring-ink-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-flame-500 text-black">
            {user.role === "gestor" ? (
              <ShieldCheck size={16} />
            ) : (
              <UserRound size={16} />
            )}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-bold text-white">{user.name}</p>
            <p className="text-[10px] uppercase tracking-wide text-flame-400">
              {user.role === "gestor" ? "Gestor" : "Registrando tarefas"}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-ink-700 hover:text-white"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-flame-500 py-2.5 text-sm font-bold text-black transition hover:bg-flame-400"
        >
          <LogIn size={16} strokeWidth={2.4} /> Entrar
        </button>
      )}

      <PinGate open={open} onClose={() => setOpen(false)} />
    </>
  );
}
