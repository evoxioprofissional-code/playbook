"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { CATEGORY_OPTIONS, newId, type SavedScript } from "@/lib/scriptsStore";
import type { Channel, ScriptCategory } from "@/lib/scripts";

const EMPTY: SavedScript = {
  id: "",
  category: "abordagem",
  channel: "whatsapp",
  title: "",
  body: "",
};

export default function ScriptEditor({
  open,
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  initial: SavedScript | null;
  onClose: () => void;
  onSave: (s: SavedScript) => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = useState<SavedScript>(EMPTY);

  useEffect(() => {
    setDraft(initial ? { ...initial } : { ...EMPTY, id: newId() });
  }, [initial, open]);

  const canSave = draft.title.trim() && draft.body.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Editar script" : "Novo script"}
      subtitle="Use {cliente} {vendedor} {marca} {qtd} {cor} — preenchem sozinhos."
      footer={
        <div className="flex items-center gap-2">
          {initial && onDelete && (
            <button
              onClick={() => {
                onDelete(initial.id);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-ink-800 px-3 py-2.5 text-sm font-bold text-rose-300 ring-1 ring-ink-700 hover:text-rose-200"
            >
              <Trash2 size={15} /> Apagar
            </button>
          )}
          <button
            onClick={() => canSave && onSave({ ...draft, id: draft.id || newId() })}
            disabled={!canSave}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
              canSave ? "bg-flame-500 text-black hover:bg-flame-400" : "cursor-not-allowed bg-ink-700 text-zinc-500"
            }`}
          >
            Salvar
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <Field label="Título">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Ex.: Abertura (Revenda ou Marca própria)"
            className="se-inp"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Etapa">
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value as ScriptCategory })}
              className="se-inp"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Canal">
            <select
              value={draft.channel}
              onChange={(e) => setDraft({ ...draft, channel: e.target.value as Channel })}
              className="se-inp"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="ligacao">Ligação</option>
            </select>
          </Field>
        </div>
        <Field label="Mensagem">
          <textarea
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            rows={6}
            placeholder="Olá {cliente}! Aqui é o {vendedor} da fábrica J2A Bonés…"
            className="se-inp resize-none"
          />
        </Field>
      </div>

      <style jsx>{`
        :global(.se-inp) {
          width: 100%;
          border-radius: 0.6rem;
          border: 1px solid #26262c;
          background: #0a0a0b;
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          color: #f4f4f5;
          outline: none;
        }
        :global(.se-inp:focus) {
          border-color: #ff6b1a;
        }
      `}</style>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}
