"use client";

import { useMemo, useState } from "react";
import { Copy, Check, Phone, MessageCircle, ArrowRight, X } from "lucide-react";
import {
  SCRIPTS,
  QUESTION_SWAPS,
  CATEGORY_LABEL,
  type ScriptCategory,
} from "@/lib/scripts";

type Filter = "todos" | "direcionadas" | ScriptCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "direcionadas", label: "Perguntas direcionadas" },
  { id: "abordagem", label: CATEGORY_LABEL.abordagem },
  { id: "qualificacao", label: CATEGORY_LABEL.qualificacao },
  { id: "followup", label: CATEGORY_LABEL.followup },
  { id: "ligacao", label: CATEGORY_LABEL.ligacao },
  { id: "fechamento", label: CATEGORY_LABEL.fechamento },
  { id: "upsell", label: CATEGORY_LABEL.upsell },
  { id: "recuperacao", label: CATEGORY_LABEL.recuperacao },
];

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1600);
  };
  return { copied, copy };
}

export default function ScriptsLibrary() {
  const [filter, setFilter] = useState<Filter>("todos");
  const { copied, copy } = useCopy();

  const scripts = useMemo(
    () =>
      filter === "todos" || filter === "direcionadas"
        ? SCRIPTS
        : SCRIPTS.filter((s) => s.category === filter),
    [filter]
  );

  return (
    <div className="px-6 py-6 sm:px-8">
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              filter === f.id
                ? "bg-flame-500 text-black"
                : "bg-ink-900 text-zinc-400 ring-1 ring-ink-700 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === "direcionadas" ? (
        <SwapsView copied={copied} copy={copy} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {scripts.map((s) => {
            const isCopied = copied === s.id;
            const Icon = s.channel === "ligacao" ? Phone : MessageCircle;
            return (
              <article
                key={s.id}
                className="flex animate-fade-in flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 transition hover:border-flame-500/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-flame-500/15 px-2 py-0.5 text-[11px] font-bold text-flame-400">
                      {CATEGORY_LABEL[s.category]}
                    </span>
                    <span className="rounded-md bg-ink-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-400">
                      {s.tag}
                    </span>
                  </div>
                  <span
                    className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      s.channel === "ligacao"
                        ? "bg-violet-500/15 text-violet-300"
                        : "bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    <Icon size={11} />
                    {s.channel === "ligacao" ? "Ligação" : "WhatsApp"}
                  </span>
                </div>

                <h2 className="mt-3 text-base font-extrabold leading-snug text-white">
                  {s.title}
                </h2>

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
      )}
    </div>
  );
}

function SwapsView({
  copied,
  copy,
}: {
  copied: string | null;
  copy: (id: string, text: string) => void;
}) {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-zinc-400">
        Pergunta aberta trava a conversa e dá trabalho pro lead pensar. Troque
        pela versão <span className="font-semibold text-white">direcionada</span>:
        ela dá opções e empurra pra frente. Copie a versão certa.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {QUESTION_SWAPS.map((q, i) => {
          const id = `swap-${i}`;
          const isCopied = copied === id;
          return (
            <article
              key={id}
              className="animate-fade-in rounded-2xl border border-ink-700 bg-ink-900/80 p-5"
            >
              <div className="flex items-center gap-2 text-rose-300">
                <X size={15} className="shrink-0" />
                <p className="text-sm font-medium line-through decoration-rose-500/50">
                  {q.open}
                </p>
              </div>

              <div className="my-3 flex items-center gap-2 text-zinc-600">
                <ArrowRight size={14} />
                <span className="h-px flex-1 bg-ink-700" />
              </div>

              <div className="flex items-start gap-2 text-emerald-300">
                <Check size={16} strokeWidth={2.6} className="mt-0.5 shrink-0" />
                <p className="text-sm font-semibold text-white">{q.directed}</p>
              </div>

              <button
                onClick={() => copy(id, q.directed)}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold transition ${
                  isCopied
                    ? "bg-emerald-500 text-black"
                    : "bg-flame-500 text-black hover:bg-flame-400"
                }`}
              >
                {isCopied ? (
                  <>
                    <Check size={15} strokeWidth={2.8} /> Copiado
                  </>
                ) : (
                  <>
                    <Copy size={15} strokeWidth={2.4} /> Copiar a direcionada
                  </>
                )}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
