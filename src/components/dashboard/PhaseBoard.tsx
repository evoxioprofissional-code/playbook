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
  CalendarDays,
  ListChecks,
  Sunrise,
  type LucideIcon,
} from "lucide-react";
import {
  PHASES,
  CREATIVE_CHECKLIST,
  type Phase,
  type Section,
  type Task,
} from "@/lib/playbook";
import { monthInfo, dayKey, slotCount } from "@/lib/period";
import Modal from "@/components/ui/Modal";
import { useSession } from "@/components/team/session";
import { addLog, fetchLogs, removeLog, type TaskLog } from "@/lib/store";

const SECTION_ICON: Record<Section["key"], LucideIcon> = {
  vendas: ShoppingBag,
  instagram: Instagram,
  criativos: Megaphone,
  promo: Gift,
};

const slotKey = (taskId: string, slot: string) => `${taskId}__${slot}`;

export default function PhaseBoard() {
  const { user } = useSession();
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string>(PHASES[0].id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchLogs().then((rows: TaskLog[]) => {
      if (!active) return;
      const set = new Set<string>();
      if (user) {
        rows
          .filter((r) => r.employee_id === user.id)
          .forEach((r) => set.add(slotKey(r.task_id, r.slot)));
      }
      setMine(set);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const toggle = useCallback(
    async (taskId: string, slot: string) => {
      if (!user) return;
      const k = slotKey(taskId, slot);
      const has = mine.has(k);
      setMine((prev) => {
        const next = new Set(prev);
        has ? next.delete(k) : next.add(k);
        return next;
      });
      if (has) await removeLog(taskId, user.id, slot);
      else await addLog(taskId, user.id, slot);
    },
    [user, mine]
  );

  const doneByTask = useMemo(() => {
    const m = new Map<string, number>();
    mine.forEach((k) => {
      const id = k.split("__")[0];
      m.set(id, (m.get(id) || 0) + 1);
    });
    return m;
  }, [mine]);

  const phasePct = (phase: Phase) => {
    let total = 0;
    let done = 0;
    phase.sections.forEach((s) =>
      s.tasks.forEach((t) => {
        const cap = slotCount(t);
        total += cap;
        done += Math.min(doneByTask.get(t.id) || 0, cap);
      })
    );
    return total ? Math.round((done / total) * 100) : 0;
  };

  const active = PHASES.find((p) => p.id === activeId)!;
  const { label: monthLabel } = monthInfo();

  return (
    <div>
      {!user && (
        <div className="mx-6 mt-6 flex items-center gap-3 rounded-xl border border-flame-500/30 bg-flame-500/10 px-4 py-3 sm:mx-8">
          <LockKeyhole size={18} className="shrink-0 text-flame-400" />
          <p className="text-sm text-zinc-200">
            <span className="font-bold text-white">Entre com seu PIN</span> (canto
            inferior esquerdo) para marcar. Só dá pra marcar o{" "}
            <span className="font-semibold text-white">dia de hoje</span> — dia
            passado não vira atrás.
          </p>
        </div>
      )}

      {/* Seletor de mês */}
      <div className="flex flex-wrap items-center gap-2 px-6 pt-6 sm:px-8">
        <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <CalendarDays size={14} /> {monthLabel}
        </span>
        {PHASES.map((p) => {
          const isActive = p.id === activeId;
          const pct = phasePct(p);
          return (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                isActive
                  ? "bg-flame-500 text-black"
                  : "bg-ink-900 text-zinc-300 ring-1 ring-ink-700 hover:text-white"
              }`}
            >
              {p.tag}
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                  isActive ? "bg-black/20 text-black" : "bg-ink-800 text-flame-400"
                }`}
              >
                {pct}%
              </span>
            </button>
          );
        })}
      </div>

      {user && !loading && (
        <HojePanel phase={active} mine={mine} toggle={toggle} />
      )}

      <PhaseDetail
        phase={active}
        mine={mine}
        doneByTask={doneByTask}
        toggle={toggle}
        canEdit={Boolean(user) && !loading}
        approved={approved.has(active.id)}
        onApprove={() => setApproved((p) => new Set(p).add(active.id))}
        pct={phasePct(active)}
      />
    </div>
  );
}

function HojePanel({
  phase,
  mine,
  toggle,
}: {
  phase: Phase;
  mine: Set<string>;
  toggle: (taskId: string, slot: string) => void;
}) {
  const { year, month, days, todayDay } = monthInfo();
  const today = dayKey(year, month, todayDay);

  const daily = phase.sections.flatMap((s) =>
    s.tasks.filter((t) => t.cadence === "daily")
  );
  if (daily.length === 0) return null;

  const pending = daily.filter((t) => !mine.has(slotKey(t.id, today)));
  const done = daily.length - pending.length;
  const allDone = pending.length === 0;

  return (
    <div className="px-6 pt-5 sm:px-8">
      <div
        className={`rounded-2xl border p-4 ${
          allDone
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-flame-500/30 bg-gradient-to-r from-flame-600/15 to-transparent"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-white">
            {allDone ? (
              <Sunrise size={16} className="text-emerald-400" />
            ) : (
              <ListChecks size={16} className="text-flame-400" />
            )}
            Hoje · dia {todayDay}
          </h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              allDone
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-ink-800 text-flame-400"
            }`}
          >
            {done}/{daily.length} feitas
          </span>
        </div>

        {allDone ? (
          <p className="mt-2 text-sm text-emerald-300">
            Dia fechado. Todas as tarefas diárias da fase concluídas — manda ver no pipeline.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {pending.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => toggle(t.id, today)}
                  className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-left text-sm text-zinc-200 transition hover:border-flame-500/50 hover:text-white"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded border border-ink-600" />
                  <span className="max-w-[15rem] truncate">{t.label}</span>
                  <span className="text-[11px] font-bold text-flame-400">Feito</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PhaseDetail({
  phase,
  mine,
  doneByTask,
  toggle,
  canEdit,
  approved,
  onApprove,
  pct,
}: {
  phase: Phase;
  mine: Set<string>;
  doneByTask: Map<string, number>;
  toggle: (taskId: string, slot: string) => void;
  canEdit: boolean;
  approved: boolean;
  onApprove: () => void;
  pct: number;
}) {
  const Icon = phase.icon;
  return (
    <div className="animate-fade-in px-6 py-6 sm:px-8">
      {/* Cabeçalho da fase */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-700 bg-ink-900/80 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-flame-500/20 to-gold-500/10 text-flame-400 ring-1 ring-flame-500/30">
            <Icon size={22} strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-flame-400">
              {phase.tag} · {phase.foco}
            </p>
            <h2 className="text-xl font-extrabold leading-tight text-white">
              {phase.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {phase.metrics.map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-sm font-extrabold text-white">{m.value}</p>
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                {m.label}
              </p>
            </div>
          ))}
          <div className="ml-2 w-28">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">Você</span>
              <span className="font-bold text-flame-400">{pct}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-flame-500 to-gold-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seções */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {phase.sections.map((section) => (
          <SectionBlock
            key={section.key}
            phaseId={phase.id}
            section={section}
            mine={mine}
            doneByTask={doneByTask}
            toggle={toggle}
            canEdit={canEdit}
            approved={approved}
            onApprove={onApprove}
          />
        ))}
      </div>

      {/* Promoção do mês */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-gold-500/30 bg-gold-500/10 p-4">
        <Gift size={18} className="shrink-0 text-gold-400" />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gold-400">
            Promoção do mês
          </p>
          <p className="text-sm font-bold text-white">
            {phase.promo.name}{" "}
            <span className="font-normal text-zinc-400">· {phase.promo.detail}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({
  phaseId,
  section,
  mine,
  doneByTask,
  toggle,
  canEdit,
  approved,
  onApprove,
}: {
  phaseId: string;
  section: Section;
  mine: Set<string>;
  doneByTask: Map<string, number>;
  toggle: (taskId: string, slot: string) => void;
  canEdit: boolean;
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
    <div className="rounded-2xl border border-ink-700 bg-ink-900/80 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-zinc-400" />
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

      <div className="space-y-4">
        {section.tasks.map((task) => (
          <TaskTrack
            key={task.id}
            task={task}
            mine={mine}
            done={doneByTask.get(task.id) || 0}
            toggle={toggle}
            canEdit={canEdit && !locked}
          />
        ))}
      </div>

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
            Fase {phaseId.replace("mes-", "")} · sem o checklist completo as caixas
            de criativos ficam travadas.
          </p>
        </Modal>
      )}
    </div>
  );
}

function TaskTrack({
  task,
  mine,
  done,
  toggle,
  canEdit,
}: {
  task: Task;
  mine: Set<string>;
  done: number;
  toggle: (taskId: string, slot: string) => void;
  canEdit: boolean;
}) {
  const total = slotCount(task);
  const capped = Math.min(done, total);
  const pct = total ? Math.round((capped / total) * 100) : 0;
  const { year, month, todayDay } = monthInfo();

  let action: React.ReactNode = null;
  if (task.cadence === "daily") {
    const today = dayKey(year, month, todayDay);
    const doneToday = mine.has(slotKey(task.id, today));
    action = (
      <ActionBtn done={doneToday} canEdit={canEdit} onClick={() => toggle(task.id, today)}>
        {doneToday ? "✓ Hoje" : "Marcar hoje"}
      </ActionBtn>
    );
  } else if (task.cadence === "count") {
    const full = capped >= total;
    action = (
      <div className="flex shrink-0 items-center gap-1">
        {capped > 0 && canEdit && (
          <button
            onClick={() => toggle(task.id, String(capped))}
            title="Desfazer um"
            className="rounded-lg bg-ink-800 px-2 py-1.5 text-xs font-bold text-zinc-400 ring-1 ring-ink-700 hover:text-white"
          >
            −
          </button>
        )}
        <ActionBtn done={full} canEdit={canEdit && !full} onClick={() => toggle(task.id, String(capped + 1))}>
          {full ? "✓ Feito" : "+1"}
        </ActionBtn>
      </div>
    );
  } else {
    const doneOnce = mine.has(slotKey(task.id, "done"));
    action = (
      <ActionBtn done={doneOnce} canEdit={canEdit} onClick={() => toggle(task.id, "done")}>
        {doneOnce ? "✓ Concluído" : "Concluir"}
      </ActionBtn>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-zinc-200">{task.label}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-flame-500 to-gold-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] font-semibold text-zinc-500">
            {capped}/{total}
          </span>
        </div>
      </div>
      {action}
    </div>
  );
}

function ActionBtn({
  done,
  canEdit,
  onClick,
  children,
}: {
  done: boolean;
  canEdit: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={!canEdit}
      onClick={onClick}
      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
        done
          ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
          : "bg-flame-500 text-black hover:bg-flame-400"
      } ${!canEdit ? "opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}
