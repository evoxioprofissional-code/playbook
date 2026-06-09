"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  KanbanSquare,
  MessageSquareText,
  Clapperboard,
  Users,
  Smartphone,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import AccountBar from "@/components/team/AccountBar";

const NAV = [
  { href: "/", label: "Dashboard", sub: "Playbook mensal", icon: LayoutDashboard },
  { href: "/equipe", label: "Equipe", sub: "Acompanhamento", icon: Users },
  { href: "/crm", label: "CRM Kanban", sub: "Gestão de leads", icon: KanbanSquare },
  { href: "/scripts", label: "Scripts", sub: "Biblioteca", icon: MessageSquareText },
  { href: "/whatsapp", label: "WhatsApp", sub: "Conexão", icon: Smartphone },
  { href: "/criativos", label: "Criativos", sub: "Social media", icon: Clapperboard },
  { href: "/admin", label: "Admin", sub: "Equipe e funções", icon: ShieldCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Topbar mobile */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-ink-700 bg-ink-950/80 px-4 py-3 backdrop-blur md:hidden">
        <Brand />
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-ink-700 p-2 text-zinc-300"
          aria-label="Menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed z-50 flex h-screen w-72 shrink-0 flex-col border-r border-ink-700 bg-ink-900 transition-transform md:sticky md:top-0 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 pb-2 pt-6">
          <Brand />
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 transition ${
                  active
                    ? "bg-gradient-to-r from-flame-600/20 to-transparent text-white ring-1 ring-flame-500/30"
                    : "text-zinc-400 hover:bg-ink-800 hover:text-zinc-100"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    active ? "bg-flame-500 text-black" : "bg-ink-800 text-zinc-400 group-hover:text-flame-400"
                  }`}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block text-xs text-zinc-500">{item.sub}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-ink-700 px-4 py-4">
          <AccountBar />
          <p className="px-1 text-[11px] text-zinc-600">
            Fábrica J2A Bonés · Seridó
          </p>
        </div>
      </aside>
    </>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-flame-500 to-gold-500 font-black text-black shadow-glow">
        J2A
      </div>
      <div className="leading-tight">
        <p className="text-base font-extrabold tracking-wide text-white">
          sales j2a
        </p>
      </div>
    </div>
  );
}
