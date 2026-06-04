"use client";

import { useMemo, useState } from "react";
import { Film, Calendar, ChevronRight } from "lucide-react";
import {
  CREATIVES,
  SOCIAL_GUIDE,
  STATUS_LABEL,
  STATUS_STYLE,
  type Creative,
  type CreativeStatus,
} from "@/lib/creatives";

const STATUS_ORDER: CreativeStatus[] = ["ideia", "gravando", "edicao", "no_ar"];

export default function CreativesCenter() {
  const [items, setItems] = useState<Creative[]>(CREATIVES);
  const [month, setMonth] = useState<number | "all">("all");

  const filtered = useMemo(
    () => (month === "all" ? items : items.filter((c) => c.month === month)),
    [items, month]
  );

  const advance = (id: string) =>
    setItems((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const i = STATUS_ORDER.indexOf(c.status);
        const next = STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
        return { ...c, status: next };
      })
    );

  const noAr = items.filter((c) => c.status === "no_ar").length;

  return (
    <div className="space-y-8 px-6 py-6 sm:px-8">
      {/* Guia de social media por mês */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-flame-400" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-300">
            Ritmo de postagem
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SOCIAL_GUIDE.map((g) => (
            <div
              key={g.month}
              className="rounded-2xl border border-ink-700 bg-ink-900/80 p-4"
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-flame-400">
                Mês {g.month}
              </p>
              <p className="mt-1 text-sm font-bold text-white">{g.theme}</p>
              <div className="mt-3 space-y-1 text-xs text-zinc-400">
                <p>{g.stories}</p>
                <p>{g.feed}</p>
                <p className="font-semibold text-gold-400">{g.ads}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline de produção */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Film size={16} className="text-flame-400" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-300">
              Produção de criativos
            </h2>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
              {noAr} no ar
            </span>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-ink-900 p-1 ring-1 ring-ink-700">
            {(["all", 1, 2, 3, 4] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMonth(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  month === m
                    ? "bg-flame-500 text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {m === "all" ? "Todos" : `M${m}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <article
              key={c.id}
              className="flex animate-fade-in flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-4 transition hover:border-flame-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-ink-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                  Mês {c.month} · {c.format}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[c.status]}`}
                >
                  {STATUS_LABEL[c.status]}
                </span>
              </div>

              <h3 className="mt-2.5 text-sm font-bold leading-snug text-white">
                {c.title}
              </h3>
              <p className="mt-1 text-xs text-zinc-500">Ângulo: {c.angle}</p>

              <button
                onClick={() => advance(c.id)}
                className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-ink-700 bg-ink-850 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-flame-500/40 hover:text-white"
              >
                Avançar etapa <ChevronRight size={13} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
