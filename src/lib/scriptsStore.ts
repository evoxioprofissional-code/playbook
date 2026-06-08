import { SCRIPTS, SCRIPT_FIELDS, type ScriptCategory, type Channel } from "./scripts";

export type SavedScript = {
  id: string;
  category: ScriptCategory;
  channel: Channel;
  title: string;
  body: string;
  /** Nota de voz (base64 data URL). Se presente, o script envia como áudio. */
  audio?: string;
};

const LS = "j2a_scripts_v1";

function seed(): SavedScript[] {
  return SCRIPTS.map((s) => ({
    id: s.id,
    category: s.category,
    channel: s.channel,
    title: s.title,
    body: s.body,
  }));
}

export function loadScripts(): SavedScript[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(LS);
    if (raw) {
      const a = JSON.parse(raw);
      if (Array.isArray(a) && a.length) return a;
    }
  } catch {
    /* ignora */
  }
  return seed();
}

export function persistScripts(list: SavedScript[]) {
  localStorage.setItem(LS, JSON.stringify(list));
  window.dispatchEvent(new Event("j2a-scripts-changed"));
}

/** Valores salvos pelo vendedor (nome, marca, qtd, cor) usados no preenchimento. */
export function loadFieldValues(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("j2a_script_fields") || "{}");
  } catch {
    return {};
  }
}

/** Substitui os tokens {cliente} {vendedor} {marca} {qtd} {cor} pelos valores. */
export function fillBody(body: string, values: Record<string, string>) {
  return body.replace(/\{(\w+)\}/g, (_, t) => {
    const f = SCRIPT_FIELDS.find((x) => x.token === t);
    const v = values[t]?.trim();
    return v || (f ? `[${f.label.toLowerCase()}]` : `{${t}}`);
  });
}

export function newId() {
  return `cs-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export const CATEGORY_OPTIONS: { id: ScriptCategory; label: string }[] = [
  { id: "abordagem", label: "Abordagem" },
  { id: "qualificacao", label: "Qualificação" },
  { id: "followup", label: "Follow-up" },
  { id: "ligacao", label: "Ligação" },
  { id: "fechamento", label: "Fechamento" },
  { id: "upsell", label: "Upsell / Pós-venda" },
  { id: "recuperacao", label: "Recuperação" },
];
