export type CreativeStatus = "ideia" | "gravando" | "edicao" | "no_ar";

export type Creative = {
  id: string;
  month: number;
  title: string;
  angle: string;
  format: "Reels" | "Story" | "Feed" | "Anúncio";
  status: CreativeStatus;
};

export const STATUS_LABEL: Record<CreativeStatus, string> = {
  ideia: "Ideia",
  gravando: "Gravando",
  edicao: "Edição",
  no_ar: "No ar",
};

export const STATUS_STYLE: Record<CreativeStatus, string> = {
  ideia: "bg-ink-700 text-zinc-300",
  gravando: "bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/30",
  edicao: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  no_ar: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
};

export const CREATIVES: Creative[] = [
  { id: "c1", month: 1, title: "Esteira em ritmo de fábrica", angle: "Escala fabril", format: "Anúncio", status: "no_ar" },
  { id: "c2", month: 1, title: "Zoom na costura reforçada", angle: "Qualidade", format: "Feed", status: "no_ar" },
  { id: "c3", month: 1, title: "Bastidor: bordado da matriz", angle: "Bastidores", format: "Story", status: "edicao" },
  { id: "c4", month: 2, title: "Boné que desbota vs. J2A", angle: "Dor", format: "Anúncio", status: "edicao" },
  { id: "c5", month: 2, title: "Caixas saindo pra entrega", angle: "Prova social", format: "Story", status: "gravando" },
  { id: "c6", month: 3, title: "Expectativa vs. realidade da logo", angle: "Humor", format: "Reels", status: "ideia" },
  { id: "c7", month: 3, title: "Depoimento B2B: RD Streetwear", angle: "Depoimento", format: "Anúncio", status: "ideia" },
  { id: "c8", month: 4, title: "Últimos lotes da quinzena", angle: "Escassez", format: "Story", status: "ideia" },
];

/** Diretrizes fixas de social media por mês (referência rápida da Central). */
export const SOCIAL_GUIDE = [
  { month: 1, stories: "5 Stories/dia", feed: "Feed 3x/semana", ads: "6 anúncios", theme: "Bastidores e máquinas" },
  { month: 2, stories: "5 Stories/dia", feed: "Feed 4x/semana", ads: "8 anúncios", theme: "Prova social" },
  { month: 3, stories: "5 Stories/dia", feed: "1 Reel/semana", ads: "10 anúncios", theme: "Rotina + humor" },
  { month: 4, stories: "5 Stories/dia", feed: "Escassez", ads: "12 anúncios", theme: "Gatilhos fortes" },
];
