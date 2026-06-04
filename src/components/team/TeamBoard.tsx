"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  UserRound,
  Clock,
  TriangleAlert,
  Activity,
} from "lucide-react";
import { PHASES } from "@/lib/playbook";
import {
  fetchEmployees,
  fetchCompletions,
  isSupabaseEnabled,
  type Employee,
  type Completion,
} from "@/lib/store";
import { formatWhen } from "@/components/dashboard/PhaseBoard";

// Índice de tarefas: id -> rótulo + fase, para exibir o feed e contar metas.
const TASK_INDEX = new Map(
  PHASES.flatMap((p) =>
    p.sections.flatMap((s) =>
      s.tasks.map((t) => [t.id, { label: t.label, tag: p.tag, phaseId: p.id }] as const)
    )
  )
);
const TASKS_PER_PHASE = new Map(
  PHASES.map((p) => [p.id, p.sections.reduce((n, s) => n + s.tasks.length, 0)])
);
const TOTAL_TASKS = Array.from(TASKS_PER_PHASE.values()).reduce(
  (a, b) => a + b,
  0
);

export default function TeamBoard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [emps, comps] = await Promise.all([
      fetchEmployees(),
      fetchCompletions(),
    ]);
    setEmployees(emps);
    setCompletions(comps);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const vendedores = employees.filter((e) => e.role === "vendedor");
  const nameById = useMemo(
    () => new Map(employees.map((e) => [e.id, e.name])),
    [employees]
  );

  const feed = useMemo(
    () =>
      [...completions]
        .sort((a, b) => b.completed_at.localeCompare(a.completed_at))
        .slice(0, 12),
    [completions]
  );

  return (
    <div className="space-y-8 px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Quem está seguindo o plano — progresso por funcionário e registro de cada marcação.
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

      {/* Cartões por funcionário */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vendedores.map((emp) => {
          const mine = completions.filter((c) => c.employee_id === emp.id);
          const total = mine.length;
          const pct = Math.round((total / TOTAL_TASKS) * 100);
          const last = mine
            .map((c) => c.completed_at)
            .sort()
            .at(-1);
          return (
            <article
              key={emp.id}
              className="rounded-2xl border border-ink-700 bg-ink-900/80 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 text-flame-400">
                    <UserRound size={18} />
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    {emp.name}
                  </h3>
                </div>
                <span className="text-xl font-extrabold text-flame-400">
                  {pct}%
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-flame-500 to-gold-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-500">
                {total} de {TOTAL_TASKS} tarefas
              </p>

              {/* Progresso por mês */}
              <div className="mt-4 space-y-2">
                {PHASES.map((p) => {
                  const inPhase = mine.filter(
                    (c) => TASK_INDEX.get(c.task_id)?.phaseId === p.id
                  ).length;
                  const totalPhase = TASKS_PER_PHASE.get(p.id) || 1;
                  const pp = Math.round((inPhase / totalPhase) * 100);
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="w-12 shrink-0 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                        {p.tag}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800">
                        <div
                          className="h-full rounded-full bg-flame-500/70"
                          style={{ width: `${pp}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right text-[10px] font-semibold text-zinc-400">
                        {inPhase}/{totalPhase}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Clock size={12} />
                {last ? `Última marcação: ${formatWhen(last)}` : "Sem marcações ainda"}
              </p>
            </article>
          );
        })}
      </section>

      {/* Feed de atividade */}
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
              Nenhuma tarefa marcada ainda. As marcações aparecem aqui com nome e horário.
            </p>
          ) : (
            <ul className="divide-y divide-ink-700">
              {feed.map((c, i) => {
                const t = TASK_INDEX.get(c.task_id);
                return (
                  <li
                    key={`${c.task_id}-${c.employee_id}-${i}`}
                    className="flex items-center gap-3 bg-ink-900/60 px-4 py-3"
                  >
                    <span className="rounded-md bg-flame-500/15 px-2 py-0.5 text-[10px] font-bold text-flame-400">
                      {t?.tag ?? "—"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                      <span className="font-bold text-white">
                        {nameById.get(c.employee_id) ?? "Alguém"}
                      </span>{" "}
                      concluiu: {t?.label ?? c.task_id}
                    </span>
                    <span className="shrink-0 text-xs font-medium text-zinc-500">
                      {formatWhen(c.completed_at)}
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
