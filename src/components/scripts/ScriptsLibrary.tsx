"use client";

import { useState } from "react";
import { Copy, Check, Quote } from "lucide-react";
import { SCRIPTS } from "@/lib/scripts";

export default function ScriptsLibrary() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (id: string, body: string) => {
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      // fallback silencioso para ambientes sem clipboard API
      const ta = document.createElement("textarea");
      ta.value = body;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1600);
  };

  return (
    <div className="grid grid-cols-1 gap-4 px-6 py-6 sm:px-8 lg:grid-cols-2">
      {SCRIPTS.map((s) => {
        const isCopied = copied === s.id;
        return (
          <article
            key={s.id}
            className="flex animate-fade-in flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 transition hover:border-flame-500/40"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-flame-500/15 px-2 py-0.5 text-[11px] font-bold text-flame-400">
                  {s.phase}
                </span>
                <span className="rounded-md bg-ink-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-400">
                  {s.tag}
                </span>
              </div>
              <Quote size={18} className="text-ink-600" />
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-white">{s.title}</h2>

            <p className="mt-2 flex-1 rounded-xl border border-ink-700 bg-ink-950 p-4 text-sm leading-relaxed text-zinc-300">
              {s.body}
            </p>

            <button
              onClick={() => copy(s.id, s.body)}
              className={`mt-4 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
                isCopied
                  ? "bg-emerald-500 text-black"
                  : "bg-flame-500 text-black hover:bg-flame-400"
              }`}
            >
              {isCopied ? (
                <>
                  <Check size={16} strokeWidth={2.8} /> Copiado
                </>
              ) : (
                <>
                  <Copy size={16} strokeWidth={2.4} /> Copiar script
                </>
              )}
            </button>
          </article>
        );
      })}
    </div>
  );
}
