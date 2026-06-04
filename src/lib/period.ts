// Utilidades de período e cadência — base da "fórmula" de caixas por tarefa.

export type Cadence = "daily" | "count" | "once";

export type SlotState = "done" | "today" | "missed" | "future";

/** Informações do mês de referência (mês atual do dispositivo). */
export function monthInfo(ref: Date = new Date()) {
  const year = ref.getFullYear();
  const month = ref.getMonth(); // 0-11
  const days = new Date(year, month + 1, 0).getDate();
  const todayDay = ref.getDate();
  const label = ref.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return { year, month, days, todayDay, label };
}

/** Chave estável de um dia: 'YYYY-MM-DD'. */
export function dayKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Quantas caixas uma tarefa tem no mês, pela cadência. */
export function slotCount(t: { cadence: Cadence; target?: number }) {
  if (t.cadence === "daily") return monthInfo().days;
  if (t.cadence === "count") return t.target ?? 1;
  return 1; // once
}

export function cadenceLabel(t: { cadence: Cadence; target?: number }) {
  if (t.cadence === "daily") return `${monthInfo().days} dias`;
  if (t.cadence === "count") return `${t.target ?? 1}x no mês`;
  return "1x";
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
