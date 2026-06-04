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
  type: "Revenda" | "Fardamento";
  qty: number;
  value: number;
  column: ColumnId;
  hot?: boolean;
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

export const SEED_LEADS: Lead[] = [
  { id: "l1", name: "Rafael Dantas", company: "RD Streetwear", type: "Revenda", qty: 250, value: 6250, column: "novo" },
  { id: "l2", name: "Time Açaí do Norte", company: "Açaí do Norte", type: "Fardamento", qty: 80, value: 2080, column: "novo" },
  { id: "l3", name: "Marina Costa", company: "Brava Caps", type: "Revenda", qty: 500, value: 13500, column: "qualificacao", hot: true },
  { id: "l4", name: "Barbearia Navalha", company: "Navalha de Ouro", type: "Fardamento", qty: 40, value: 1080, column: "qualificacao" },
  { id: "l5", name: "Lucas Pereira", company: "LP Apparel", type: "Revenda", qty: 300, value: 7800, column: "apresentacao", hot: true },
  { id: "l6", name: "Clínica Vida", company: "Vida Saúde", type: "Fardamento", qty: 120, value: 3120, column: "apresentacao" },
  { id: "l7", name: "Pedro Henrique", company: "PH Caps Co.", type: "Revenda", qty: 200, value: 5200, column: "follow24" },
  { id: "l8", name: "Conveniência 24h", company: "Posto Seridó", type: "Fardamento", qty: 60, value: 1560, column: "follow48" },
  { id: "l9", name: "Studio Ink", company: "Studio Ink Tattoo", type: "Fardamento", qty: 35, value: 945, column: "follow48" },
  { id: "l10", name: "Camila Rocha", company: "CR Brand", type: "Revenda", qty: 1000, value: 27000, column: "ganho", hot: true },
  { id: "l11", name: "Equipe Corrida", company: "Run Caicó", type: "Fardamento", qty: 150, value: 3900, column: "ganho" },
];

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
