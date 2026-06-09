"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  GripVertical,
  Lock,
  TriangleAlert,
} from "lucide-react";
import {
  ICON_OPTIONS,
  SECTION_KEYS,
  phaseIcon,
  type Phase,
  type Section,
  type Task,
} from "@/lib/playbook";
import { fetchPlaybook, savePlaybook, resetPlaybook, defaultPlaybook } from "@/lib/playbookStore";
import { isSupabaseEnabled } from "@/lib/store";
import { cadenceLabel } from "@/lib/period";

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const CADENCES: { value: Task["cadence"]; label: string }[] = [
  { value: "daily", label: "Todo dia" },
  { value: "count", label: "X vezes no mês" },
  { value: "once", label: "1 vez (no mês)" },
];

export default function PlaybookEditor() {
  const [draft, setDraft] = useState<Phase[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchPlaybook().then((p) => {
      setDraft(p);
      setActiveId(p[0]?.id || "");
      setLoading(false);
    });
  }, []);

  const active = useMemo(() => draft.find((p) => p.id === activeId), [draft, activeId]);

  // Atualiza uma fase pelo id, mantendo o resto.
  const updatePhase = (id: string, fn: (p: Phase) => Phase) => {
    setDraft((d) => d.map((p) => (p.id === id ? fn(p) : p)));
    setDirty(true);
    setMsg("");
  };

  function addPhase() {
    const n = draft.length + 1;
    const np: Phase = {
      id: uid("fase"),
      month: n,
      tag: `Mês ${n}`,
      title: "Nova fase",
      foco: "Defina o foco",
      iconKey: "rocket",
      metrics: [{ label: "Meta", value: "—" }],
      promo: { name: "Promoção do mês", detail: "Descreva o benefício." },
      sections: [{ key: "vendas", title: "Vendas", tasks: [] }],
    };
    setDraft((d) => [...d, np]);
    setActiveId(np.id);
    setDirty(true);
  }

  function removePhase(id: string) {
    if (!confirm("Excluir esta fase? As marcações já feitas pelas tarefas dela deixam de contar.")) return;
    setDraft((d) => {
      const next = d.filter((p) => p.id !== id);
      if (activeId === id) setActiveId(next[0]?.id || "");
      return next;
    });
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    const r = await savePlaybook(draft);
    setSaving(false);
    if (r.ok) {
      setDirty(false);
      setMsg("Playbook salvo. Os funcionários já veem a versão nova.");
    } else {
      setMsg(r.error || "Falha ao salvar.");
    }
  }

  async function restore() {
    if (!confirm("Restaurar o playbook original (de fábrica)? Suas edições serão descartadas.")) return;
    await resetPlaybook();
    const def = defaultPlaybook();
    setDraft(def);
    setActiveId(def[0]?.id || "");
    setDirty(false);
    setMsg("Playbook restaurado para o padrão.");
  }

  if (loading) {
    return <p className="px-6 py-10 text-center text-sm text-zinc-500">Carregando playbook…</p>;
  }

  return (
    <div className="px-6 py-6 sm:px-8">
      {!isSupabaseEnabled && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3">
          <TriangleAlert size={18} className="shrink-0 text-gold-400" />
          <p className="text-sm text-zinc-200">
            Supabase não conectado — as edições ficam salvas só neste navegador.
          </p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Edite as fases, metas e tarefas do plano. O que você salvar aqui é o que a
          equipe vê no <b className="text-white">Dashboard</b>.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={restore}
            className="flex items-center gap-1.5 rounded-xl bg-ink-800 px-3 py-2 text-sm font-semibold text-zinc-300 ring-1 ring-ink-700 hover:text-white"
          >
            <RotateCcw size={15} /> Restaurar padrão
          </button>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition ${
              dirty && !saving
                ? "bg-flame-500 text-black hover:bg-flame-400"
                : "cursor-not-allowed bg-ink-700 text-zinc-500"
            }`}
          >
            <Save size={16} /> {saving ? "Salvando…" : dirty ? "Salvar playbook" : "Salvo"}
          </button>
        </div>
      </div>

      {msg && (
        <p className="mb-4 rounded-lg bg-ink-800 px-3 py-2 text-xs font-semibold text-emerald-300">
          {msg}
        </p>
      )}

      {/* Abas de fase */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {draft.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveId(p.id)}
            className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
              p.id === activeId
                ? "bg-flame-500 text-black"
                : "bg-ink-900 text-zinc-300 ring-1 ring-ink-700 hover:text-white"
            }`}
          >
            {p.tag || p.title}
          </button>
        ))}
        <button
          onClick={addPhase}
          className="flex items-center gap-1 rounded-xl bg-ink-800 px-3 py-2 text-sm font-bold text-flame-400 ring-1 ring-ink-700 hover:bg-ink-700"
        >
          <Plus size={15} /> Fase
        </button>
      </div>

      {active && (
        <PhaseEditor
          phase={active}
          onChange={(fn) => updatePhase(active.id, fn)}
          onRemove={() => removePhase(active.id)}
          canRemove={draft.length > 1}
        />
      )}
    </div>
  );
}

function PhaseEditor({
  phase,
  onChange,
  onRemove,
  canRemove,
}: {
  phase: Phase;
  onChange: (fn: (p: Phase) => Phase) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const usedKeys = new Set(phase.sections.map((s) => s.key));
  const availableKeys = SECTION_KEYS.filter((k) => !usedKeys.has(k.key));

  const set = (patch: Partial<Phase>) => onChange((p) => ({ ...p, ...patch }));

  const updateSection = (idx: number, fn: (s: Section) => Section) =>
    onChange((p) => ({ ...p, sections: p.sections.map((s, i) => (i === idx ? fn(s) : s)) }));

  return (
    <div className="space-y-5 rounded-2xl border border-ink-700 bg-ink-900/60 p-5">
      {/* Identidade da fase */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FieldI label="Etiqueta (ex.: Mês 1)">
          <input className="pb-inp" value={phase.tag} onChange={(e) => set({ tag: e.target.value })} />
        </FieldI>
        <FieldI label="Título">
          <input className="pb-inp" value={phase.title} onChange={(e) => set({ title: e.target.value })} />
        </FieldI>
        <FieldI label="Foco">
          <input className="pb-inp" value={phase.foco} onChange={(e) => set({ foco: e.target.value })} />
        </FieldI>
      </div>

      {/* Ícone */}
      <div>
        <Lbl>Ícone da fase</Lbl>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map((o) => {
            const Ico = o.icon;
            const on = phase.iconKey === o.key;
            return (
              <button
                key={o.key}
                title={o.label}
                onClick={() => set({ iconKey: o.key })}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  on
                    ? "bg-flame-500 text-black"
                    : "bg-ink-800 text-zinc-400 ring-1 ring-ink-700 hover:text-white"
                }`}
              >
                <Ico size={17} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Métricas */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Lbl>Métricas (aparecem no topo da fase)</Lbl>
          <button
            onClick={() => set({ metrics: [...phase.metrics, { label: "Métrica", value: "—" }] })}
            className="flex items-center gap-1 text-xs font-bold text-flame-400 hover:text-flame-300"
          >
            <Plus size={13} /> Métrica
          </button>
        </div>
        <div className="space-y-2">
          {phase.metrics.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="pb-inp flex-1"
                placeholder="Rótulo (ex.: Stories/dia)"
                value={m.label}
                onChange={(e) =>
                  set({ metrics: phase.metrics.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })
                }
              />
              <input
                className="pb-inp w-32"
                placeholder="Valor (ex.: 5)"
                value={m.value}
                onChange={(e) =>
                  set({ metrics: phase.metrics.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })
                }
              />
              <button
                onClick={() => set({ metrics: phase.metrics.filter((_, j) => j !== i) })}
                className="rounded-lg p-2 text-zinc-500 hover:text-rose-400"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Promoção */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FieldI label="Promoção do mês · nome">
          <input
            className="pb-inp"
            value={phase.promo.name}
            onChange={(e) => set({ promo: { ...phase.promo, name: e.target.value } })}
          />
        </FieldI>
        <FieldI label="Promoção · detalhe">
          <input
            className="pb-inp"
            value={phase.promo.detail}
            onChange={(e) => set({ promo: { ...phase.promo, detail: e.target.value } })}
          />
        </FieldI>
      </div>

      {/* Seções e tarefas */}
      <div className="space-y-3">
        <Lbl>Áreas e tarefas</Lbl>
        {phase.sections.map((s, idx) => (
          <SectionEditor
            key={s.key}
            section={s}
            onChange={(fn) => updateSection(idx, fn)}
            onRemove={() =>
              onChange((p) => ({ ...p, sections: p.sections.filter((_, i) => i !== idx) }))
            }
          />
        ))}
        {availableKeys.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-zinc-500">Adicionar área:</span>
            {availableKeys.map((k) => (
              <button
                key={k.key}
                onClick={() =>
                  set({ sections: [...phase.sections, { key: k.key, title: k.label, tasks: [] }] })
                }
                className="flex items-center gap-1 rounded-lg bg-ink-800 px-2.5 py-1.5 text-xs font-bold text-zinc-300 ring-1 ring-ink-700 hover:text-flame-400"
              >
                <Plus size={13} /> {k.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Excluir fase */}
      {canRemove && (
        <div className="border-t border-ink-700 pt-3">
          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-rose-400"
          >
            <Trash2 size={14} /> Excluir esta fase
          </button>
        </div>
      )}

      <style jsx>{`
        :global(.pb-inp) {
          width: 100%;
          border-radius: 0.6rem;
          border: 1px solid #26262c;
          background: #0a0a0b;
          padding: 0.5rem 0.7rem;
          font-size: 0.875rem;
          color: #f4f4f5;
          outline: none;
        }
        :global(.pb-inp:focus) {
          border-color: #ff6b1a;
        }
      `}</style>
    </div>
  );
}

function SectionEditor({
  section,
  onChange,
  onRemove,
}: {
  section: Section;
  onChange: (fn: (s: Section) => Section) => void;
  onRemove: () => void;
}) {
  const setTask = (idx: number, patch: Partial<Task>) =>
    onChange((s) => ({ ...s, tasks: s.tasks.map((t, i) => (i === idx ? { ...t, ...patch } : t)) }));

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-950/50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <input
          className="pb-inp flex-1 font-bold"
          value={section.title}
          onChange={(e) => onChange((s) => ({ ...s, title: e.target.value }))}
        />
        {section.key === "criativos" && (
          <label
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-ink-800 px-2.5 py-2 text-xs font-semibold text-zinc-300 ring-1 ring-ink-700"
            title="Exige o checklist de qualidade antes de liberar"
          >
            <input
              type="checkbox"
              className="accent-flame-500"
              checked={Boolean(section.gated)}
              onChange={(e) => onChange((s) => ({ ...s, gated: e.target.checked }))}
            />
            <Lock size={12} /> Checklist
          </label>
        )}
        <button
          onClick={onRemove}
          title="Remover área"
          className="shrink-0 rounded-lg p-2 text-zinc-500 hover:text-rose-400"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="space-y-2">
        {section.tasks.map((t, i) => (
          <div key={t.id} className="flex items-start gap-2 rounded-lg bg-ink-900/70 p-2">
            <GripVertical size={15} className="mt-2 shrink-0 text-zinc-600" />
            <div className="min-w-0 flex-1 space-y-2">
              <input
                className="pb-inp"
                placeholder="Descreva a tarefa…"
                value={t.label}
                onChange={(e) => setTask(i, { label: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <select
                  className="pb-inp w-44"
                  value={t.cadence}
                  onChange={(e) => {
                    const cadence = e.target.value as Task["cadence"];
                    setTask(i, { cadence, target: cadence === "count" ? t.target || 4 : undefined });
                  }}
                >
                  {CADENCES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {t.cadence === "count" && (
                  <input
                    type="number"
                    min={1}
                    className="pb-inp w-20"
                    value={t.target ?? 1}
                    onChange={(e) => setTask(i, { target: Math.max(1, Number(e.target.value) || 1) })}
                  />
                )}
                <span className="text-[11px] text-zinc-500">
                  = {cadenceLabel(t)} de caixas
                </span>
              </div>
            </div>
            <button
              onClick={() => onChange((s) => ({ ...s, tasks: s.tasks.filter((_, j) => j !== i) }))}
              className="shrink-0 rounded-lg p-2 text-zinc-500 hover:text-rose-400"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() =>
          onChange((s) => ({ ...s, tasks: [...s.tasks, { id: uid("t"), label: "", cadence: "daily" }] }))
        }
        className="mt-2 flex items-center gap-1 text-xs font-bold text-flame-400 hover:text-flame-300"
      >
        <Plus size={13} /> Tarefa
      </button>
    </div>
  );
}

function FieldI({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Lbl>{label}</Lbl>
      {children}
    </label>
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
      {children}
    </span>
  );
}
