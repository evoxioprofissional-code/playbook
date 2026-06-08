"use client";

import { useState } from "react";
import { Film, Calendar, ChevronRight } from "lucide-react";
import {
  CREATIVES,
  SOCIAL_GUIDE,
  STATUS_LABEL,
  type Creative,
  type CreativeStatus,
} from "@/lib/creatives";

const STATUS_ORDER: CreativeStatus[] = ["ideia", "gravando", "edicao", "no_ar"];
const STATUS_DOT: Record<CreativeStatus, string> = {
  ideia: "bg-zinc-500",
  gravando: "bg-gold-500",
  edicao: "bg-sky-500",
  no_ar: "bg-emerald-500",
};

export default function CreativesCenter() {
  const [items, setItems] = useState<Creative[]>(CREATIVES);

  const advance = (id: string) =>
    setItems((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const i = STATUS_ORDER.indexOf(c.status);
        return { ...c, status: STATUS_ORDER[(i + 1) % STATUS_ORDER.length] };
      })
    );

  const noAr = items.filter((c) => c.status === "no_ar").length;

  return (
    <div className="space-y-8 px-6 py-6 sm:px-8">
      {/* Produção — agrupada por etapa */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Film size={16} className="text-flame-400" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-300">
            Produção
          </h2>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
            {noAr} de {items.length} no ar
          </span>
        </div>

        <div className="space-y-5">
          {STATUS_ORDER.map((st) => {
            const list = items.filter((c) => c.status === st);
            if (list.length === 0) return null;
            return (
              <div key={st}>
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-400">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[st]}`} />
                  {STATUS_LABEL[st]} · {list.length}
                </p>
                <div className="space-y-2">
                  {list.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900/80 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{c.title}</p>
                        <p className="text-[11px] text-zinc-500">
                          Mês {c.month} · {c.format} · {c.angle}
                        </p>
                      </div>
                      {st !== "no_ar" ? (
                        <button
                          onClick={() => advance(c.id)}
                          className="flex shrink-0 items-center gap-1 rounded-lg bg-flame-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-flame-400"
                        >
                          Avançar <ChevronRight size={13} />
                        </button>
                      ) : (
                        <span className="shrink-0 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300">
                          ✓ Publicado
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ritmo de postagem — referência */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-flame-400" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-300">
            Ritmo de postagem
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SOCIAL_GUIDE.map((g) => (
            <div key={g.month} className="rounded-2xl border border-ink-700 bg-ink-900/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-flame-400">
                Mês {g.month}
              </p>
              <p className="mt-1 text-sm font-bold text-white">{g.theme}</p>
              <div className="mt-2 space-y-0.5 text-xs text-zinc-400">
                <p>{g.stories}</p>
                <p>{g.feed}</p>
                <p className="font-semibold text-gold-400">{g.ads}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
