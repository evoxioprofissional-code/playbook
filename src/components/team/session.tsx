"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Role, Area } from "@/lib/store";

export type SessionUser = {
  id: string;
  name: string;
  role: Role;
  areas?: Area[] | null;
};

type SessionCtx = {
  user: SessionUser | null;
  ready: boolean;
  login: (u: SessionUser) => void;
  logout: () => void;
};

const Ctx = createContext<SessionCtx | null>(null);
const LS_KEY = "j2a_session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignora */
    }
    setReady(true);
  }, []);

  const login = (u: SessionUser) => {
    setUser(u);
    localStorage.setItem(LS_KEY, JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LS_KEY);
  };

  return (
    <Ctx.Provider value={{ user, ready, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession deve estar dentro de SessionProvider");
  return ctx;
}
