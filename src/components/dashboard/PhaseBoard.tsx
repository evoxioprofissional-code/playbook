"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ShieldCheck,
  Lock,
  Gift,
  ShoppingBag,
  Instagram,
  Megaphone,
  LockKeyhole,
  type LucideIcon,
} from "lucide-react";
import { PHASES, CREATIVE_CHECKLIST, type Phase, type Section } from "@/lib/playbook";
import Modal from "@/components/ui/Modal";
import { useSession } from "@/components/team/session";
import {
  addCompletion,
  fetchCompletions,
  removeCompletion,
  type Completion,
} from "@/lib/store";

const SECTION_ICON: Record<Section["key"], LucideIcon> = {
  vendas: ShoppingBag,
  instagram: Instagram,
  criativos: Megaphone,
  promo: Gift,
};

export function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PhaseBoard() {
  const { user } = useSession();
  const [mine, setMine] = useState<Map<string, string>>(new Map());
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Carrega as conclusões do funcionário logado.
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCompletions().then((rows: Completion[]) => {
      if (!active) return;
      const map = new Map<string, string>();
      if (user) {
        rows
          .filter((r) => r.employee_id === user.id)
          .forEach((r) => map.set(r.task_id, r.completed_at));
      }
      setMine(map);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const toggle = useCallback(
    async (taskId: string) => {
      if (!user) return;
      const has = mine.has(taskId);
      setMine((prev) => {
        const next = new Map(prev);
        has ? next.delete(taskId) : next.set(taskId, new Date().toISOString());
        return next;
      });
      if (has) await removeCompletion(taskId, user.id);
      else await addCompletion(taskId, user.id);
    },
    [user, mine]
  );

  return (
    <div>
      {!user && (
        <div className="mx-6 mt-6 flex items-center gap-3 rounded-xl border border-flame-500/30 bg-flame-500/10 px-4 py-3 sm:mx-8">
          <LockKeyhole size={18} className="shrink-0 text-flame-400" />
          <p className="text-sm text-zinc-200">
            <span className="font-bold text-white">Entre com seu PIN</span> (canto
            inferior esquerdo) para marcar suas tarefas. Cada marcação fica
            registrada com seu nome e horário.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:px-8 lg:grid-cols-2 2xl:grid-cols-4">
        {PHASES.map((phase) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            mine={mine}
            toggle={toggle}
            canEdit={Boolean(user) && !loading}
            approved={approved.has(phase.id)}
            onApprove={() => setApproved((p) => new Set(p).add(phase.id))}
          />
        ))}
      </div>
    </div>
  );
}

function PhaseCard({
  phase,
  mine,
  toggle,
  canEdit,
  approved,
  onApprove,
}: {
  phase: Phase;
  mine: Map<string, string>;
  toggle: (id: string) => void;
  canEdit: boolean;
  approved: boolean;
  onApprove: () => void;
}) {
  const Icon = phase.icon;

  const allTasks = useMemo(
    () => phase.sections.flatMap((s) => s.tasks),
    [phase]
  );
  const completed = allTasks.filter((t) => mine.has(t.id)).length;
  const pct = Math.round((completed / allTasks.length) * 100);

  return (
    <article className="flex animate-fade-in flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 transition hover:border-flame-500/40">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-flame-500/20 to-gold-500/10 text-flame-400 ring-1 ring-flame-500/30">
            <Icon size={20} strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-flame-400">
              {phase.tag}
            </p>
            <h2 className="text-lg font-extrabold leading-tight text-white">
              {phase.title}
            </h2>
          </div>
        </div>
        <span className="rounded-full bg-ink-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 ring-1 ring-ink-600">
          {phase.foco}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {phase.metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg bg-ink-850 px-2 py-2 text-center ring-1 ring-ink-700"
          >
            <p className="text-sm font-extrabold text-white">{m.value}</p>
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              {m.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300">Sua execução</span>
          <span className="font-bold text-flame-400">{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-flame-500 to-gold-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {phase.sections.map((section) => (
          <SectionBlock
            key={section.key}
            phaseId={phase.id}
            section={section}
            mine={mine}
            toggle={toggle}
            canEdit={canEdit}
            approved={approved}
            onApprove={onApprove}
          />
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-gold-500/30 bg-gold-500/10 p-3">
        <div className="flex items-center gap-2">
          <Gift size={15} className="text-gold-400" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-gold-400">
            Promoção do mês
          </p>
        </div>
        <p className="mt-1 text-sm font-bold text-white">{phase.promo.name}</p>
        <p className="text-xs text-zinc-400">{phase.promo.detail}</p>
      </div>
    </article>
  );
}

function SectionBlock({
  phaseId,
  section,
  mine,
  toggle,
  canEdit,
  approved,
  onApprove,
}: {
  phaseId: string;
  section: Section;
  mine: Map<string, string>;
  toggle: (id: string) => void;
  canEdit: boolean;
  approved: boolean;
  onApprove: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [checks, setChecks] = useState<Set<string>>(new Set());
  const Icon = SECTION_ICON[section.key];

  const allChecked = checks.size === CREATIVE_CHECKLIST.length;
  const locked = !canEdit || (section.gated && !approved);

  const toggleCheck = (id: string) =>
    setChecks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-zinc-400" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-300">
            {section.title}
          </h3>
        </div>
        {section.gated &&
          (approved ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
              <ShieldCheck size={11} /> Liberado
            </span>
          ) : (
            <button
              disabled={!canEdit}
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1 rounded-full bg-flame-500/15 px-2 py-0.5 text-[10px] font-bold text-flame-400 ring-1 ring-flame-500/40 enabled:hover:bg-flame-500/25 disabled:opacity-40"
            >
              <Lock size={11} /> Validar
            </button>
          ))}
      </div>

      <ul className="space-y-1">
        {section.tasks.map((task) => {
          const when = mine.get(task.id);
          const isDone = Boolean(when);
          return (
            <li key={task.id}>
              <button
                disabled={locked}
                onClick={() => toggle(task.id)}
                className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                  locked ? "cursor-not-allowed opacity-45" : "hover:bg-ink-800"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                    isDone
                      ? "border-flame-500 bg-flame-500 text-black"
                      : "border-ink-600 bg-ink-850"
                  }`}
                >
                  {isDone && <Check size={11} strokeWidth={3.5} />}
                </span>
                <span className="leading-snug">
                  <span className={isDone ? "text-zinc-500 line-through" : "text-zinc-200"}>
                    {task.label}
                  </span>
                  {when && (
                    <span className="mt-0.5 block text-[10px] font-medium text-emerald-400/80">
                      ✓ você · {formatWhen(when)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {section.gated && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Checklist obrigatório · Criativos"
          subtitle="Confirme antes de subir os anúncios no tráfego."
          footer={
            <button
              disabled={!allChecked}
              onClick={() => {
                onApprove();
                setModalOpen(false);
              }}
              className={`w-full rounded-xl py-2.5 text-sm font-bold transition ${
                allChecked
                  ? "bg-flame-500 text-black hover:bg-flame-400"
                  : "cursor-not-allowed bg-ink-700 text-zinc-500"
              }`}
            >
              {allChecked ? "Liberar publicação" : "Marque todos os itens"}
            </button>
          }
        >
          <ul className="space-y-2">
            {CREATIVE_CHECKLIST.map((item) => {
              const checked = checks.has(item.id);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => toggleCheck(item.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-left hover:border-flame-500/40"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        checked
                          ? "border-flame-500 bg-flame-500 text-black"
                          : "border-ink-600 bg-ink-850"
                      }`}
                    >
                      {checked && <Check size={13} strokeWidth={3.5} />}
                    </span>
                    <span className="text-sm font-medium text-zinc-200">
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[11px] text-zinc-500">
            Fase {phaseId.replace("mes-", "")} · sem o checklist completo a
            publicação fica travada.
          </p>
        </Modal>
      )}
    </div>
  );
}
