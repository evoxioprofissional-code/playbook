"use client";

import { usePathname } from "next/navigation";
import { useSession } from "./session";
import LoginScreen from "./LoginScreen";

// Exige login (e-mail/senha) pra usar o app. Sem sessão → tela de login.
// Em /admin, mostra o login do painel do administrador.
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useSession();
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 text-sm text-zinc-500">
        Carregando…
      </div>
    );
  }
  if (!user) return <LoginScreen admin={isAdmin} />;
  return <>{children}</>;
}
