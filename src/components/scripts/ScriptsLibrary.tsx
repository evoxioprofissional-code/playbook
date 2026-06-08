"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Check, Phone, MessageCircle, ArrowRight, X, Send, Pencil, Plus } from "lucide-react";
import {
  QUESTION_SWAPS,
  CATEGORY_LABEL,
  SCRIPT_FIELDS,
  type ScriptCategory,
} from "@/lib/scripts";
import { waLink, waSend, waStatus } from "@/lib/wa";
import { useScripts } from "@/components/scripts/useScripts";
import ScriptEditor from "@/components/scripts/ScriptEditor";
import type { SavedScript } from "@/lib/scriptsStore";
import { useSession } from "@/components/team/session";

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

const LS_FIELDS = "j2a_script_fields";

export default function ScriptsLibrary() {
  const [filter, setFilter] = useState<Filter>("todos");
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const { scripts: allScripts, save, remove } = useScripts();
  const [editing, setEditing] = useState<SavedScript | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const { user } = useSession();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_FIELDS);
      if (raw) setValues(JSON.parse(raw));
    } catch {
      /* ignora */
    }
    waStatus().then((r) => setConnected(r.state === "open"));
  }, []);
  useEffect(() => {
    localStorage.setItem(LS_FIELDS, JSON.stringify(values));
  }, [values]);

  const fill = useMemo(
    () => (body: string) => {
      // {vendedor} vem automaticamente do vendedor logado (PIN).
      const merged: Record<string, string> = {
        ...values,
        vendedor: user?.name || values.vendedor || "",
      };
      return body.replace(/\{(\w+)\}/g, (_, t) => {
        const f = SCRIPT_FIELDS.find((x) => x.token === t);
        const v = merged[t]?.trim();
        return v || (f ? `[${f.label.toLowerCase()}]` : `{${t}}`);
      });
    },
    [values, user]
  );

  const phone = values.telefone;
  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  async function copy(id: string, text: string) {
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
  }

  // Envia pelo número conectado; se não houver conexão, abre o link wa.me.
  async function whats(id: string, text: string) {
    if (connected && phone?.trim()) {
      setBusy(id);
      const r = await waSend(phone, text);
      setBusy(null);
      if (r.ok) {
        setSent(id);
        setTimeout(() => setSent((s) => (s === id ? null : s)), 1900);
        return;
      }
    }
    window.open(waLink(phone, text), "_blank", "noopener");
  }

  const scripts =
    filter === "todos" || filter === "direcionadas"
      ? allScripts
      : allScripts.filter((s) => s.category === filter);

  const waState = { connected, busy, sent };

  return (
    <div className="px-6 py-6 sm:px-8">
      {/* Preenchimento */}
      <div className="mb-5 rounded-2xl border border-ink-700 bg-ink-900/80 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-flame-400">
            Preencha uma vez · scripts prontos pra copiar ou enviar
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              connected
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-ink-800 text-zinc-500"
            }`}
          >
            {connected ? "WhatsApp conectado" : "WhatsApp via link"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
              <Send size={10} /> WhatsApp do cliente
            </span>
            <input
              value={values.telefone || ""}
              onChange={(e) => set("telefone", e.target.value)}
              placeholder="(84) 99999-9999"
              inputMode="tel"
              className="w-full rounded-lg border border-emerald-500/30 bg-ink-950 px-2.5 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500"
            />
          </label>
          {SCRIPT_FIELDS.filter((f) => f.token !== "vendedor").map((f) => (
            <label key={f.token} className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                {f.label}
              </span>
              <input
                value={values[f.token] || ""}
                onChange={(e) => set(f.token, e.target.value)}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-ink-700 bg-ink-950 px-2.5 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-flame-500"
              />
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">
          {user
            ? `Seu nome (${user.name}) entra automático nos scripts pelo login.`
            : "Entre com PIN (canto inferior esquerdo) pra seu nome entrar automático nos scripts."}
          {connected
            ? " WhatsApp conectado: envia direto pro cliente."
            : " Sem WhatsApp conectado: o botão abre o WhatsApp com a mensagem pronta."}
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
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
        {filter !== "direcionadas" && (
          <button
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
            className="ml-auto flex items-center gap-1 rounded-xl bg-flame-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-flame-400"
          >
            <Plus size={14} /> Novo script
          </button>
        )}
      </div>

      {filter === "direcionadas" ? (
        <SwapsView copied={copied} copy={copy} whats={whats} wa={waState} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {scripts.map((s) => {
            const Icon = s.channel === "ligacao" ? Phone : MessageCircle;
            const text = fill(s.body);
            return (
              <article
                key={s.id}
                className="flex animate-fade-in flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 transition hover:border-flame-500/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-flame-500/15 px-2 py-0.5 text-[11px] font-bold text-flame-400">
                    {CATEGORY_LABEL[s.category]}
                  </span>
                  <div className="flex items-center gap-1.5">
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
                    <button
                      onClick={() => {
                        setEditing(s);
                        setEditorOpen(true);
                      }}
                      title="Editar script"
                      className="rounded-md p-1 text-zinc-500 hover:text-flame-400"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>

                <h2 className="mt-3 text-base font-extrabold leading-snug text-white">
                  {s.title}
                </h2>

                <p className="mt-2 flex-1 rounded-xl border border-ink-700 bg-ink-950 p-4 text-sm leading-relaxed text-zinc-300">
                  {text}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => copy(s.id, text)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${
                      copied === s.id
                        ? "bg-emerald-500 text-black"
                        : "bg-ink-800 text-zinc-200 ring-1 ring-ink-700 hover:text-white"
                    }`}
                  >
                    {copied === s.id ? (
                      <>
                        <Check size={15} strokeWidth={2.8} /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy size={15} strokeWidth={2.2} /> Copiar
                      </>
                    )}
                  </button>
                  <WhatsButton id={s.id} text={text} whats={whats} wa={waState} />
                </div>
              </article>
            );
          })}
        </div>
      )}

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

type WaState = { connected: boolean; busy: string | null; sent: string | null };

function WhatsButton({
  id,
  text,
  whats,
  wa,
}: {
  id: string;
  text: string;
  whats: (id: string, text: string) => void;
  wa: WaState;
}) {
  const isBusy = wa.busy === id;
  const isSent = wa.sent === id;
  return (
    <button
      onClick={() => whats(id, text)}
      disabled={isBusy}
      className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${
        isSent ? "bg-emerald-400 text-black" : "bg-emerald-500 text-black hover:bg-emerald-400"
      }`}
    >
      {isSent ? (
        <>
          <Check size={15} strokeWidth={2.8} /> Enviado
        </>
      ) : isBusy ? (
        "Enviando..."
      ) : (
        <>
          <Send size={15} strokeWidth={2.4} /> {wa.connected ? "Enviar" : "WhatsApp"}
        </>
      )}
    </button>
  );
}

function SwapsView({
  copied,
  copy,
  whats,
  wa,
}: {
  copied: string | null;
  copy: (id: string, text: string) => void;
  whats: (id: string, text: string) => void;
  wa: WaState;
}) {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-zinc-400">
        Pergunta aberta trava a conversa. Troque pela versão{" "}
        <span className="font-semibold text-white">direcionada</span>: ela dá
        opções e empurra pra frente.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {QUESTION_SWAPS.map((q, i) => {
          const id = `swap-${i}`;
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

              <div className="flex items-start gap-2">
                <Check size={16} strokeWidth={2.6} className="mt-0.5 shrink-0 text-emerald-400" />
                <p className="text-sm font-semibold text-white">{q.directed}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => copy(id, q.directed)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold transition ${
                    copied === id
                      ? "bg-emerald-500 text-black"
                      : "bg-ink-800 text-zinc-200 ring-1 ring-ink-700 hover:text-white"
                  }`}
                >
                  {copied === id ? (
                    <>
                      <Check size={14} strokeWidth={2.8} /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={14} strokeWidth={2.2} /> Copiar
                    </>
                  )}
                </button>
                <WhatsButton id={id} text={q.directed} whats={whats} wa={wa} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
