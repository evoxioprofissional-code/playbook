"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Mic, Square } from "lucide-react";
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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(blob);
  });
}

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
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDraft(initial ? { ...initial } : { ...EMPTY, id: newId() });
  }, [initial, open]);

  const canSave = draft.title.trim() && (draft.body.trim() || draft.audio);

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecording(false);
        setRecSecs(0);
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const b64 = await blobToBase64(blob);
        setDraft((d) => ({ ...d, audio: b64 }));
      };
      mr.start();
      recRef.current = mr;
      setRecording(true);
      setRecSecs(0);
      timerRef.current = setInterval(() => setRecSecs((s) => s + 1), 1000);
    } catch {
      alert("Não consegui acessar o microfone. Permita o acesso no navegador.");
    }
  }

  function stopRec() {
    recRef.current?.stop();
  }

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
        <Field label={draft.audio ? "Texto (opcional — vai junto da nota de voz?)" : "Mensagem"}>
          <textarea
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            rows={draft.audio ? 3 : 6}
            placeholder="Olá {cliente}! Aqui é o {vendedor} da fábrica J2A Bonés…"
            className="se-inp resize-none"
          />
        </Field>

        {/* Áudio (nota de voz) */}
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Nota de voz (opcional)
          </span>
          {draft.audio ? (
            <div className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-950 p-2">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={draft.audio} className="h-9 flex-1" />
              <button
                onClick={() => setDraft((d) => ({ ...d, audio: undefined }))}
                className="rounded-lg p-2 text-zinc-400 hover:text-rose-400"
                title="Remover áudio"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : recording ? (
            <button
              onClick={stopRec}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 py-2.5 text-sm font-bold text-rose-300"
            >
              <Square size={14} /> Parar gravação · {recSecs}s
            </button>
          ) : (
            <button
              onClick={startRec}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-700 bg-ink-900 py-2.5 text-sm font-bold text-zinc-200 hover:border-emerald-500/40 hover:text-white"
            >
              <Mic size={16} className="text-emerald-400" /> Gravar áudio
            </button>
          )}
          <p className="mt-1.5 text-[11px] text-zinc-500">
            Com áudio, o script é enviado como <b>nota de voz</b> — chega como se você
            tivesse gravado na hora.
          </p>
        </div>
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
