"use client";

import { useMemo, useState } from "react";
import { X, Plus, Search, Pencil, Send, ArrowDownToLine } from "lucide-react";
import { CATEGORY_LABEL } from "@/lib/scripts";
import { fillBody, loadFieldValues, type SavedScript } from "@/lib/scriptsStore";
import { CATEGORY_OPTIONS } from "@/lib/scriptsStore";
import { useScripts } from "@/components/scripts/useScripts";
import ScriptEditor from "@/components/scripts/ScriptEditor";
import { useSession } from "@/components/team/session";

export default function ScriptsDrawer({
  open,
  onClose,
  contactName,
  onInsert,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  contactName: string;
  onInsert: (text: string) => void;
  onSend: (text: string) => void;
}) {
  const { scripts, save, remove } = useScripts();
  const { user } = useSession();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<SavedScript | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const values = useMemo(
    () => {
      const saved = loadFieldValues();
      return {
        ...saved,
        cliente: contactName,
        // {vendedor} = vendedor logado (PIN) usando o sistema.
        vendedor: user?.name || saved.vendedor || "",
      };
    },
    [contactName, open, user]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return scripts.filter(
      (x) => !s || x.title.toLowerCase().includes(s) || x.body.toLowerCase().includes(s)
    );
  }, [scripts, q]);

  // Agrupa por etapa do funil, na ordem do funil.
  const grouped = useMemo(() => {
    return CATEGORY_OPTIONS.map((c) => ({
      cat: c,
      items: filtered.filter((s) => s.category === c.id),
    })).filter((g) => g.items.length > 0);
  }, [filtered]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="flex h-full w-full max-w-md flex-col border-l border-ink-700 bg-ink-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
          <div>
            <h3 className="text-sm font-extrabold text-white">Scripts</h3>
            <p className="text-[11px] text-zinc-500">
              Preenchendo para <span className="text-flame-400">{contactName}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
              className="flex items-center gap-1 rounded-lg bg-flame-500 px-2.5 py-1.5 text-xs font-bold text-black hover:bg-flame-400"
            >
              <Plus size={14} /> Novo
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Busca */}
        <div className="p-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-zinc-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar script…"
              className="w-full rounded-xl border border-ink-700 bg-ink-950 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-flame-500"
            />
          </div>
        </div>

        {/* Lista agrupada */}
        <div className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
          {grouped.length === 0 && (
            <p className="px-1 py-6 text-center text-sm text-zinc-500">Nenhum script.</p>
          )}
          {grouped.map((g) => (
            <div key={g.cat.id}>
              <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-flame-400">
                {g.cat.label}
              </p>
              <div className="space-y-2">
                {g.items.map((s) => {
                  const text = fillBody(s.body, values);
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl border border-ink-700 bg-ink-850 p-3 transition hover:border-flame-500/40"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold text-white">{s.title}</p>
                        <button
                          onClick={() => {
                            setEditing(s);
                            setEditorOpen(true);
                          }}
                          title="Editar"
                          className="shrink-0 rounded-md p-1 text-zinc-500 hover:text-flame-400"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                      <p className="mb-2.5 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-zinc-400">
                        {text}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            onInsert(text);
                            onClose();
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-ink-800 py-2 text-xs font-bold text-zinc-200 ring-1 ring-ink-700 hover:text-white"
                        >
                          <ArrowDownToLine size={14} /> Inserir
                        </button>
                        <button
                          onClick={() => {
                            onSend(text);
                            onClose();
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-black hover:bg-emerald-400"
                        >
                          <Send size={14} /> Enviar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ScriptEditor
        open={editorOpen}
        initial={editing}
        onClose={() => setEditorOpen(false)}
        onSave={(s) => {
          save(s);
          setEditorOpen(false);
        }}
        onDelete={(id) => remove(id)}
      />
    </div>
  );
}
