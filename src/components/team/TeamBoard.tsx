"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Clock,
  TriangleAlert,
  Activity,
  Trophy,
  Flame,
} from "lucide-react";
import { PHASES } from "@/lib/playbook";
import { slotCount, formatWhen, dayKey } from "@/lib/period";
import {
  fetchEmployees,
  fetchLogs,
  isSupabaseEnabled,
  type Employee,
  type TaskLog,
} from "@/lib/store";

// Índice de tarefas: id -> rótulo, fase e nº de caixas (slots).
const TASK_INDEX = new Map(
  PHASES.flatMap((p) =>
    p.sections.flatMap((s) =>
      s.tasks.map(
        (t) =>
          [
            t.id,
            { label: t.label, tag: p.tag, phaseId: p.id, slots: slotCount(t) },
          ] as const
      )
    )
  )
);
const SLOTS_PER_PHASE = new Map(
  PHASES.map((p) => [
    p.id,
    p.sections.reduce(
      (n, s) => n + s.tasks.reduce((m, t) => m + slotCount(t), 0),
      0
    ),
  ])
);
const TOTAL_SLOTS = Array.from(SLOTS_PER_PHASE.values()).reduce(
  (a, b) => a + b,
  0
);

// Sequência de dias seguidos com pelo menos 1 caixa diária marcada.
function computeStreak(logs: TaskLog[]) {
  const set = new Set(
    logs.map((l) => l.slot).filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
  );
  const key = (d: Date) => dayKey(d.getFullYear(), d.getMonth(), d.getDate());
  const day = new Date();
  if (!set.has(key(day))) {
    day.setDate(day.getDate() - 1);
    if (!set.has(key(day))) return 0; // nem hoje nem ontem
  }
  let streak = 0;
  while (set.has(key(day))) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

// Conta logs por (employee, phase) e total, respeitando o teto de cada tarefa.
function countByPhase(logs: TaskLog[], phaseId: string) {
  const perTask = new Map<string, number>();
  logs.forEach((l) => {
    const t = TASK_INDEX.get(l.task_id);
    if (t?.phaseId === phaseId) perTask.set(l.task_id, (perTask.get(l.task_id) || 0) + 1);
  });
  let done = 0;
  perTask.forEach((n, id) => {
    done += Math.min(n, TASK_INDEX.get(id)?.slots || 0);
  });
  return done;
}

export default function TeamBoard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [emps, rows] = await Promise.all([fetchEmployees(), fetchLogs()]);
    setEmployees(emps);
    setLogs(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const nameById = useMemo(
    () => new Map(employees.map((e) => [e.id, e.name])),
    [employees]
  );

  const feed = useMemo(
    () =>
      [...logs]
        .sort((a, b) => b.marked_at.localeCompare(a.marked_at))
        .slice(0, 14),
    [logs]
  );

  // Estatísticas por vendedor, ordenadas para o ranking.
  const stats = useMemo(() => {
    return employees
      .filter((e) => e.role === "vendedor")
      .map((emp) => {
        const mine = logs.filter((c) => c.employee_id === emp.id);
        const done = PHASES.reduce((s, p) => s + countByPhase(mine, p.id), 0);
        const streak = computeStreak(mine);
        const last = mine.map((c) => c.marked_at).sort().at(-1);
        return { emp, mine, done, streak, last };
      })
      .sort((a, b) => b.done - a.done || b.streak - a.streak);
  }, [employees, logs]);

  return (
    <div className="space-y-8 px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Quem está seguindo o plano — progresso por funcionário e cada caixa marcada (com horário).
        </p>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-xl bg-ink-800 px-3 py-2 text-sm font-semibold text-zinc-300 ring-1 ring-ink-700 hover:text-white"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {!isSupabaseEnabled && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3">
          <TriangleAlert size={18} className="shrink-0 text-gold-400" />
          <p className="text-sm text-zinc-200">
            <span className="font-bold text-white">Modo local:</span> Supabase não
            conectado. Cada navegador vê só os próprios dados. Conecte o Supabase
            para o gestor acompanhar os 3 de verdade.
          </p>
        </div>
      )}

      {/* Placar da equipe */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Trophy size={16} className="text-gold-400" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-300">
            Ranking do mês
          </h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-ink-700">
          {stats.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              Nenhum funcionário cadastrado.
            </p>
          ) : (
            <ul className="divide-y divide-ink-700">
              {stats.map((s, i) => {
                const pct = Math.round((s.done / TOTAL_SLOTS) * 100);
                const medal = ["🥇", "🥈", "🥉"][i] ?? `${i + 1}º`;
                return (
                  <li
                    key={s.emp.id}
                    className="flex items-center gap-3 bg-ink-900/60 px-4 py-3"
                  >
                    <span className="w-7 shrink-0 text-center text-xl">{medal}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold text-white">
                          {s.emp.name}
                        </p>
                        <span className="shrink-0 text-base font-extrabold text-flame-400">
                          {pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-flame-500 to-gold-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span
                          className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-flame-400"
                          title="Dias seguidos"
                        >
                          <Flame size={12} /> {s.streak}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
                        <Clock size={11} />
                        {s.last ? formatWhen(s.last) : "sem marcações"} · {s.done}/{TOTAL_SLOTS}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Activity size={16} className="text-flame-400" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-300">
            Últimas marcações
          </h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-ink-700">
          {feed.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              Nenhuma caixa marcada ainda. As marcações aparecem aqui com nome e horário.
            </p>
          ) : (
            <ul className="divide-y divide-ink-700">
              {feed.map((c, i) => {
                const t = TASK_INDEX.get(c.task_id);
                return (
                  <li
                    key={`${c.task_id}-${c.employee_id}-${c.slot}-${i}`}
                    className="flex items-center gap-3 bg-ink-900/60 px-4 py-3"
                  >
                    <span className="rounded-md bg-flame-500/15 px-2 py-0.5 text-[10px] font-bold text-flame-400">
                      {t?.tag ?? "—"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                      <span className="font-bold text-white">
                        {nameById.get(c.employee_id) ?? "Alguém"}
                      </span>{" "}
                      marcou: {t?.label ?? c.task_id}
                    </span>
                    <span className="shrink-0 text-xs font-medium text-zinc-500">
                      {formatWhen(c.marked_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
