import { supabase } from "./supabase";

export type ColumnId =
  | "novo"
  | "qualificacao"
  | "apresentacao"
  | "follow24"
  | "follow48"
  | "ganho";

export type Lead = {
  id: string;
  name: string;
  company: string;
  type: "Revenda" | "Marca própria";
  qty: number;
  value: number;
  column: ColumnId;
  hot?: boolean;
  createdAt: string; // ISO — entrada do lead, base do SLA
};

export type Column = {
  id: ColumnId;
  title: string;
  hint: string;
  accent: string; // classe de cor da barra
};

export const COLUMNS: Column[] = [
  { id: "novo", title: "Lead Novo", hint: "SLA 5 min", accent: "bg-flame-500" },
  { id: "qualificacao", title: "Qualificação", hint: "BANT", accent: "bg-gold-500" },
  { id: "apresentacao", title: "Apresentação", hint: "Mockup enviado", accent: "bg-sky-500" },
  { id: "follow24", title: "Follow-Up 24h", hint: "Reaquecer", accent: "bg-violet-500" },
  { id: "follow48", title: "Follow-Up 48h", hint: "Gatilho da perda", accent: "bg-rose-500" },
  { id: "ganho", title: "Fechado / Ganho", hint: "Receita", accent: "bg-emerald-500" },
];

/** Meta de faturamento do mês (editável). */
export const META_MES = 80000;

/** SLA de primeiro contato, em minutos. */
export const SLA_MIN = 5;

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

export const SEED_LEADS: Lead[] = [
  { id: "l1", name: "Rafael Dantas", company: "RD Streetwear", type: "Revenda", qty: 250, value: 6250, column: "novo", createdAt: ago(2) },
  { id: "l2", name: "Time Açaí do Norte", company: "Açaí do Norte", type: "Marca própria", qty: 80, value: 2080, column: "novo", createdAt: ago(9) },
  { id: "l3", name: "Marina Costa", company: "Brava Caps", type: "Revenda", qty: 500, value: 13500, column: "qualificacao", hot: true, createdAt: ago(95) },
  { id: "l4", name: "Barbearia Navalha", company: "Navalha de Ouro", type: "Marca própria", qty: 40, value: 1080, column: "qualificacao", createdAt: ago(140) },
  { id: "l5", name: "Lucas Pereira", company: "LP Apparel", type: "Revenda", qty: 300, value: 7800, column: "apresentacao", hot: true, createdAt: ago(320) },
  { id: "l6", name: "Clínica Vida", company: "Vida Saúde", type: "Marca própria", qty: 120, value: 3120, column: "apresentacao", createdAt: ago(400) },
  { id: "l7", name: "Pedro Henrique", company: "PH Caps Co.", type: "Revenda", qty: 200, value: 5200, column: "follow24", createdAt: ago(1500) },
  { id: "l8", name: "Conveniência 24h", company: "Posto Seridó", type: "Marca própria", qty: 60, value: 1560, column: "follow48", createdAt: ago(3100) },
  { id: "l9", name: "Studio Ink", company: "Studio Ink Tattoo", type: "Marca própria", qty: 35, value: 945, column: "follow48", createdAt: ago(4300) },
  { id: "l10", name: "Camila Rocha", company: "CR Brand", type: "Revenda", qty: 1000, value: 27000, column: "ganho", hot: true, createdAt: ago(5000) },
  { id: "l11", name: "Equipe Corrida", company: "Run Caicó", type: "Marca própria", qty: 150, value: 3900, column: "ganho", createdAt: ago(6000) },
];

// ───────── Persistência no Supabase (tabela leads) ─────────

type LeadRow = {
  id: string;
  name: string;
  company: string | null;
  type: Lead["type"];
  qty: number;
  value: number;
  column_id: ColumnId;
  hot: boolean;
  created_at: string;
};

function rowToLead(r: LeadRow): Lead {
  return {
    id: r.id,
    name: r.name,
    company: r.company || "—",
    type: r.type,
    qty: r.qty,
    value: Number(r.value),
    column: r.column_id,
    hot: r.hot,
    createdAt: r.created_at,
  };
}

export async function fetchLeads(): Promise<Lead[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as LeadRow[]).map(rowToLead);
}

export async function createLead(l: {
  name: string;
  company: string;
  type: Lead["type"];
  qty: number;
  value: number;
}): Promise<Lead | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: l.name,
      company: l.company,
      type: l.type,
      qty: l.qty,
      value: l.value,
      column_id: "novo",
      hot: false,
    })
    .select()
    .single();
  if (error || !data) return null;
  return rowToLead(data as LeadRow);
}

export async function moveLead(id: string, column: ColumnId): Promise<void> {
  if (!supabase) return;
  await supabase.from("leads").update({ column_id: column }).eq("id", id);
}

export async function setLeadHot(id: string, hot: boolean): Promise<void> {
  if (!supabase) return;
  await supabase.from("leads").update({ hot }).eq("id", id);
}

export async function removeLead(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("leads").delete().eq("id", id);
}

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Idade de um lead em texto curto a partir de um "agora". */
export function formatAge(createdAt: string, now: number) {
  const min = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60_000));
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

/**
 * Estado do SLA de um lead novo.
 * remaining > 0 → dentro do prazo (mostra contagem regressiva mm:ss).
 * remaining <= 0 → estourou (mostra há quanto tempo).
 */
export function slaStatus(createdAt: string, now: number) {
  const elapsedMs = now - new Date(createdAt).getTime();
  const remainingMs = SLA_MIN * 60_000 - elapsedMs;
  const ok = remainingMs > 0;
  const mmss = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };
  return {
    ok,
    label: ok ? mmss(remainingMs) : mmss(-remainingMs),
  };
}
