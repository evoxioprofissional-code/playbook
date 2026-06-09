import {
  Gauge,
  Target,
  Split,
  Repeat,
  Rocket,
  TrendingUp,
  Flame,
  Trophy,
  Crown,
  Zap,
  Users,
  Star,
  type LucideIcon,
} from "lucide-react";
import type { Cadence } from "./period";

/** Ícones que o gestor pode escolher para cada fase (chave serializável). */
export const ICON_OPTIONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "gauge", label: "Velocímetro", icon: Gauge },
  { key: "target", label: "Alvo", icon: Target },
  { key: "split", label: "Divisão", icon: Split },
  { key: "repeat", label: "Ciclo", icon: Repeat },
  { key: "rocket", label: "Foguete", icon: Rocket },
  { key: "trending", label: "Crescimento", icon: TrendingUp },
  { key: "flame", label: "Chama", icon: Flame },
  { key: "trophy", label: "Troféu", icon: Trophy },
  { key: "crown", label: "Coroa", icon: Crown },
  { key: "zap", label: "Raio", icon: Zap },
  { key: "users", label: "Equipe", icon: Users },
  { key: "star", label: "Estrela", icon: Star },
];

/** Resolve a chave do ícone para o componente (com fallback). */
export function phaseIcon(key?: string): LucideIcon {
  return ICON_OPTIONS.find((o) => o.key === key)?.icon || Gauge;
}

/** Chaves de seção válidas (ligadas às áreas do funcionário). */
export const SECTION_KEYS: { key: Section["key"]; label: string }[] = [
  { key: "vendas", label: "Vendas" },
  { key: "instagram", label: "Instagram" },
  { key: "criativos", label: "Criativos · Tráfego" },
];

export type Task = {
  id: string;
  label: string;
  /** Cadência define quantas caixas a tarefa tem no mês (ver period.ts). */
  cadence: Cadence;
  /** Para cadência "count": total de vezes no mês. */
  target?: number;
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
  /** Chave do ícone (ver ICON_OPTIONS). Serializável p/ salvar no banco. */
  iconKey: string;
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
    iconKey: "gauge",
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
          { id: "m1-v1", label: "Responder todo lead em menos de 5 minutos", cadence: "daily" },
          { id: "m1-v2", label: "Sem perguntas abertas — usar opções direcionadas", cadence: "daily" },
          { id: "m1-v3", label: 'Abrir com opção: "Revenda ou Marca própria?"', cadence: "daily" },
        ],
      },
      {
        key: "instagram",
        title: "Instagram",
        tasks: [
          { id: "m1-i1", label: "Postar os 5 Stories do dia (bastidores, máquinas)", cadence: "daily" },
          { id: "m1-i2", label: "Captar barulho real de fábrica nos vídeos", cadence: "daily" },
          { id: "m1-i3", label: "Feed com zoom extremo nas costuras (3x/semana)", cadence: "count", target: 12 },
        ],
      },
      {
        key: "criativos",
        title: "Criativos · Tráfego",
        gated: true,
        tasks: [
          { id: "m1-c1", label: "Subir anúncio mostrando escala fabril", cadence: "count", target: 6 },
          { id: "m1-c2", label: "Validar proporção 9:16 no checklist", cadence: "once" },
          { id: "m1-c3", label: "Aprovar revisão ortográfica antes de publicar", cadence: "once" },
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
    iconKey: "target",
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
          { id: "m2-v1", label: "Qualificar com BANT (Budget, Authority, Need, Time)", cadence: "daily" },
          { id: "m2-v2", label: "Ancorar o preço antes do orçamento final", cadence: "daily" },
          { id: "m2-v3", label: "Registrar o critério de qualificação no CRM", cadence: "daily" },
        ],
      },
      {
        key: "instagram",
        title: "Instagram",
        tasks: [
          { id: "m2-i1", label: "Postar os 5 Stories do dia (prova social, envios)", cadence: "daily" },
          { id: "m2-i2", label: "Postar print de cliente satisfeito", cadence: "count", target: 8 },
          { id: "m2-i3", label: "Feed (4x/semana)", cadence: "count", target: 16 },
        ],
      },
      {
        key: "criativos",
        title: "Criativos · Tráfego",
        gated: true,
        tasks: [
          { id: "m2-c1", label: 'Subir anúncio de dor ("desbota vs. J2A")', cadence: "count", target: 8 },
          { id: "m2-c2", label: "Definir o ângulo da campanha do mês", cadence: "once" },
          { id: "m2-c3", label: "Validar 9:16 e ortografia no checklist", cadence: "once" },
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
    iconKey: "split",
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
          { id: "m3-v1", label: "Dividir o CRM: SDR qualifica o 1º contato", cadence: "once" },
          { id: "m3-v2", label: "Closer assume leads quentes e orçamentos grandes", cadence: "once" },
          { id: "m3-v3", label: "Prospecção ativa no Seridó (barbearias, clínicas)", cadence: "daily" },
        ],
      },
      {
        key: "instagram",
        title: "Instagram",
        tasks: [
          { id: "m3-i1", label: "Mostrar a rotina acelerada dos vendedores", cadence: "daily" },
          { id: "m3-i2", label: "Reel de humor (expectativa vs. realidade da logo)", cadence: "count", target: 4 },
        ],
      },
      {
        key: "criativos",
        title: "Criativos · Tráfego",
        gated: true,
        tasks: [
          { id: "m3-c1", label: "Subir anúncio com depoimento B2B em vídeo", cadence: "count", target: 10 },
          { id: "m3-c2", label: "Validar 9:16 e ortografia no checklist", cadence: "once" },
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
    iconKey: "repeat",
    metrics: [
      { label: "Follow-up", value: "+72h" },
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
          { id: "m4-v1", label: "Ligar para todo lead travado há mais de 72h", cadence: "daily" },
          { id: "m4-v2", label: "Oferecer Bucket Hat no fechamento (upsell)", cadence: "daily" },
        ],
      },
      {
        key: "instagram",
        title: "Instagram",
        tasks: [
          { id: "m4-i1", label: 'Gatilho de escassez ("últimos lotes da quinzena")', cadence: "daily" },
        ],
      },
      {
        key: "criativos",
        title: "Criativos · Tráfego",
        gated: true,
        tasks: [
          { id: "m4-c1", label: "Subir anúncio escalando os melhores formatos", cadence: "count", target: 12 },
          { id: "m4-c2", label: "Aumentar orçamento nos campeões dos meses anteriores", cadence: "once" },
          { id: "m4-c3", label: "Validar 9:16 e ortografia no checklist", cadence: "once" },
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
