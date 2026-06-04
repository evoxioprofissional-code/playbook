"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ShieldCheck,
  Lock,
  Gift,
  ShoppingBag,
  Instagram,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { PHASES, CREATIVE_CHECKLIST, type Phase, type Section } from "@/lib/playbook";
import Modal from "@/components/ui/Modal";

const SECTION_ICON: Record<Section["key"], LucideIcon> = {
  vendas: ShoppingBag,
  instagram: Instagram,
  criativos: Megaphone,
  promo: Gift,
};

export default function PhaseBoard() {
  // Conjunto de tarefas concluídas e fases com checklist de criativos liberado.
  const [done, setDone] = useState<Set<string>>(new Set());
  const [approved, setApproved] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:px-8 lg:grid-cols-2 2xl:grid-cols-4">
      {PHASES.map((phase) => (
        <PhaseCard
          key={phase.id}
          phase={phase}
          done={done}
          toggle={toggle}
          approved={approved.has(phase.id)}
          onApprove={() => setApproved((p) => new Set(p).add(phase.id))}
        />
      ))}
    </div>
  );
}

function PhaseCard({
  phase,
  done,
  toggle,
  approved,
  onApprove,
}: {
  phase: Phase;
  done: Set<string>;
  toggle: (id: string) => void;
  approved: boolean;
  onApprove: () => void;
}) {
  const Icon = phase.icon;

  const allTasks = useMemo(
    () => phase.sections.flatMap((s) => s.tasks),
    [phase]
  );
  const completed = allTasks.filter((t) => done.has(t.id)).length;
  const pct = Math.round((completed / allTasks.length) * 100);

  return (
    <article className="flex animate-fade-in flex-col rounded-2xl border border-ink-700 bg-ink-900/80 p-5 transition hover:border-flame-500/40">
      {/* Cabeçalho da fase */}
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

      {/* Métricas */}
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

      {/* Progresso */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300">Execução</span>
          <span className="font-bold text-flame-400">{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-flame-500 to-gold-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Seções */}
      <div className="mt-4 space-y-4">
        {phase.sections.map((section) => (
          <SectionBlock
            key={section.key}
            phaseId={phase.id}
            section={section}
            done={done}
            toggle={toggle}
            approved={approved}
            onApprove={onApprove}
          />
        ))}
      </div>

      {/* Promoção do mês */}
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
  done,
  toggle,
  approved,
  onApprove,
}: {
  phaseId: string;
  section: Section;
  done: Set<string>;
  toggle: (id: string) => void;
  approved: boolean;
  onApprove: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [checks, setChecks] = useState<Set<string>>(new Set());
  const Icon = SECTION_ICON[section.key];

  const allChecked = checks.size === CREATIVE_CHECKLIST.length;
  const locked = section.gated && !approved;

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
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1 rounded-full bg-flame-500/15 px-2 py-0.5 text-[10px] font-bold text-flame-400 ring-1 ring-flame-500/40 hover:bg-flame-500/25"
            >
              <Lock size={11} /> Validar
            </button>
          ))}
      </div>

      <ul className="space-y-1">
        {section.tasks.map((task) => {
          const isDone = done.has(task.id);
          return (
            <li key={task.id}>
              <button
                disabled={locked}
                onClick={() => toggle(task.id)}
                className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                  locked
                    ? "cursor-not-allowed opacity-45"
                    : "hover:bg-ink-800"
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
                <span
                  className={`leading-snug ${
                    isDone ? "text-zinc-500 line-through" : "text-zinc-200"
                  }`}
                >
                  {task.label}
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
