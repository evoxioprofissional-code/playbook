import {
  Gauge,
  Target,
  Split,
  Repeat,
  type LucideIcon,
} from "lucide-react";

export type Task = {
  id: string;
  label: string;
};

export type Section = {
  key: "vendas" | "instagram" | "criativos" | "promo";
  title: string;
  tasks: Task[];
  /** Marca a seção como tendo checklist obrigatório (gate de qualidade). */
  gated?: boolean;
};

export type Phase = {
  id: string;
  month: number;
  tag: string;
  title: string;
  foco: string;
  icon: LucideIcon;
  metrics: { label: string; value: string }[];
  promo: { name: string; detail: string };
  sections: Section[];
};

export const PHASES: Phase[] = [
  {
    id: "mes-1",
    month: 1,
    tag: "Mês 1",
    title: "O Alicerce",
    foco: "Velocidade",
    icon: Gauge,
    metrics: [
      { label: "Resposta", value: "< 5 min" },
      { label: "Stories/dia", value: "5" },
      { label: "Novos anúncios", value: "6" },
    ],
    promo: {
      name: "Matriz e Mockup Digital Grátis",
      detail: "Para fechamentos em até 48h.",
    },
    sections: [
      {
        key: "vendas",
        title: "Vendas",
        tasks: [
          { id: "m1-v1", label: "Responder todo lead em menos de 5 minutos" },
          { id: "m1-v2", label: "Sem perguntas abertas — usar opções direcionadas" },
          { id: "m1-v3", label: 'Abrir com "Revenda ou Fardamento?"' },
        ],
      },
      {
        key: "instagram",
        title: "Instagram",
        tasks: [
          { id: "m1-i1", label: "5 Stories/dia: bastidores e máquinas operando" },
          { id: "m1-i2", label: "Captar barulho real de fábrica nos vídeos" },
          { id: "m1-i3", label: "Feed 3x/semana com zoom extremo nas costuras" },
        ],
      },
      {
        key: "criativos",
        title: "Criativos · Tráfego",
        gated: true,
        tasks: [
          { id: "m1-c1", label: "Subir 6 anúncios mostrando escala fabril" },
          { id: "m1-c2", label: "Validar proporção 9:16 no checklist" },
          { id: "m1-c3", label: "Aprovar revisão ortográfica antes de publicar" },
        ],
      },
    ],
  },
  {
    id: "mes-2",
    month: 2,
    tag: "Mês 2",
    title: "Qualificação",
    foco: "Framework BANT",
    icon: Target,
    metrics: [
      { label: "Critério", value: "BANT" },
      { label: "Stories/dia", value: "5" },
      { label: "Novos anúncios", value: "8" },
    ],
    promo: {
      name: "Upgrade de Componentes",
      detail: "Fecho premium de metal sem custo na compra do lote padrão.",
    },
    sections: [
      {
        key: "vendas",
        title: "Vendas",
        tasks: [
          { id: "m2-v1", label: "Aplicar BANT: Budget, Authority, Need, Time" },
          { id: "m2-v2", label: "Ancorar o preço antes do orçamento final" },
          { id: "m2-v3", label: "Registrar o critério de qualificação no CRM" },
        ],
      },
      {
        key: "instagram",
        title: "Instagram",
        tasks: [
          { id: "m2-i1", label: "5 Stories/dia de prova social: caixas saindo" },
          { id: "m2-i2", label: "Postar prints de clientes satisfeitos" },
          { id: "m2-i3", label: "Feed 4x/semana" },
        ],
      },
      {
        key: "criativos",
        title: "Criativos · Tráfego",
        gated: true,
        tasks: [
          { id: "m2-c1", label: "Subir 8 anúncios focados na dor" },
          { id: "m2-c2", label: 'Ângulo "Bonés que desbotam vs. Qualidade J2A"' },
          { id: "m2-c3", label: "Validar 9:16 e ortografia no checklist" },
        ],
      },
    ],
  },
  {
    id: "mes-3",
    month: 3,
    tag: "Mês 3",
    title: "Máquina Híbrida",
    foco: "SDR + Closer",
    icon: Split,
    metrics: [
      { label: "Estrutura", value: "SDR + Closer" },
      { label: "Reel/semana", value: "1" },
      { label: "Novos anúncios", value: "10" },
    ],
    promo: {
      name: "Frete Subsidiado",
      detail: "Fábrica paga 50% do frete em compras acima de 100 peças.",
    },
    sections: [
      {
        key: "vendas",
        title: "Vendas",
        tasks: [
          { id: "m3-v1", label: "Dividir o CRM: SDR qualifica o 1º contato" },
          { id: "m3-v2", label: "Closer assume leads quentes e orçamentos grandes" },
          { id: "m3-v3", label: "Prospecção ativa no Seridó: barbearias, clínicas, conveniências" },
        ],
      },
      {
        key: "instagram",
        title: "Instagram",
        tasks: [
          { id: "m3-i1", label: "Mostrar a rotina acelerada dos vendedores" },
          { id: "m3-i2", label: "1 Reel/semana de humor: expectativa vs. realidade da logo" },
        ],
      },
      {
        key: "criativos",
        title: "Criativos · Tráfego",
        gated: true,
        tasks: [
          { id: "m3-c1", label: "Subir 10 anúncios com depoimentos B2B em vídeo" },
          { id: "m3-c2", label: "Validar 9:16 e ortografia no checklist" },
        ],
      },
    ],
  },
  {
    id: "mes-4",
    month: 4,
    tag: "Mês 4",
    title: "Retenção e Escala",
    foco: "LTV",
    icon: Repeat,
    metrics: [
      { label: "Follow-up", value: "+72h por ligação" },
      { label: "Upsell", value: "Bucket Hat" },
      { label: "Novos anúncios", value: "12" },
    ],
    promo: {
      name: "Indicação Premiada",
      detail: "Desconto no próximo lote por marca indicada + Founder Box para micro-influencers.",
    },
    sections: [
      {
        key: "vendas",
        title: "Vendas",
        tasks: [
          { id: "m4-v1", label: "Ligar para todo lead travado há mais de 72h" },
          { id: "m4-v2", label: "Upsell automático: oferecer Bucket Hat no fechamento" },
        ],
      },
      {
        key: "instagram",
        title: "Instagram",
        tasks: [
          { id: "m4-i1", label: 'Gatilho de escassez: "últimos lotes da quinzena na esteira"' },
        ],
      },
      {
        key: "criativos",
        title: "Criativos · Tráfego",
        gated: true,
        tasks: [
          { id: "m4-c1", label: "Subir 12 anúncios escalando os melhores formatos" },
          { id: "m4-c2", label: "Aumentar orçamento nos campeões dos meses anteriores" },
          { id: "m4-c3", label: "Validar 9:16 e ortografia no checklist" },
        ],
      },
    ],
  },
];

/** Checklist obrigatório de criativos (gate de qualidade do tráfego). */
export const CREATIVE_CHECKLIST = [
  { id: "ck-916", label: "Vídeo na proporção exata 9:16" },
  { id: "ck-orto", label: "Revisão ortográfica concluída" },
  { id: "ck-legenda", label: "Legenda e CTA conferidos" },
  { id: "ck-audio", label: "Áudio limpo, sem corte no início" },
];
