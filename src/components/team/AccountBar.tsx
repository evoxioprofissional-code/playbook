"use client";

import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useSession } from "./session";
import { supabase } from "@/lib/supabase";

export default function AccountBar() {
  const { user, ready, logout } = useSession();

  async function sair() {
    try {
      await supabase?.auth.signOut();
    } catch {
      /* ignora */
    }
    logout();
  }

  if (!ready || !user) {
    return <div className="h-10 animate-pulse rounded-xl bg-ink-800" />;
  }

  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-ink-800 px-3 py-2.5 ring-1 ring-ink-700">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-flame-500 text-black">
        {user.role === "gestor" ? <ShieldCheck size={16} /> : <UserRound size={16} />}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-bold text-white">{user.name}</p>
        <p className="text-[10px] uppercase tracking-wide text-flame-400">
          {user.role === "gestor" ? "Gestor" : "Vendedor"}
        </p>
      </div>
      <button
        onClick={sair}
        className="rounded-lg p-1.5 text-zinc-400 hover:bg-ink-700 hover:text-white"
        aria-label="Sair"
        title="Sair"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
