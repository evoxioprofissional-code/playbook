// Carrega/salva o playbook editável.
// O padrão é o PHASES de playbook.ts; o gestor pode sobrescrever pelo /admin.
// Guardado no Supabase (tabela app_config, chave 'playbook') pra valer pra todos;
// sem Supabase, cai no localStorage (só nesse navegador).

import { PHASES, type Phase } from "./playbook";
import { supabase, isSupabaseEnabled } from "./supabase";

const LS = "j2a_playbook";
const KEY = "playbook";

/** Validação leve: garante que o JSON tem o formato esperado. */
function isValid(data: unknown): data is Phase[] {
  return (
    Array.isArray(data) &&
    data.every(
      (p: any) =>
        p &&
        typeof p.id === "string" &&
        typeof p.title === "string" &&
        Array.isArray(p.sections)
    )
  );
}

/** Clona o padrão (pra editar sem mexer no original). */
export function defaultPlaybook(): Phase[] {
  return JSON.parse(JSON.stringify(PHASES));
}

export async function fetchPlaybook(): Promise<Phase[]> {
  if (isSupabaseEnabled && supabase) {
    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", KEY)
      .maybeSingle();
    if (!error && data?.value && isValid(data.value)) return data.value as Phase[];
    return defaultPlaybook();
  }
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValid(parsed)) return parsed;
      }
    } catch {
      /* ignora */
    }
  }
  return defaultPlaybook();
}

export async function savePlaybook(phases: Phase[]): Promise<{ ok: boolean; error?: string }> {
  if (isSupabaseEnabled && supabase) {
    const { error } = await supabase
      .from("app_config")
      .upsert({ key: KEY, value: phases, updated_at: new Date().toISOString() });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(LS, JSON.stringify(phases));
    return { ok: true };
  }
  return { ok: false, error: "Sem armazenamento disponível." };
}

export async function resetPlaybook(): Promise<void> {
  if (isSupabaseEnabled && supabase) {
    await supabase.from("app_config").delete().eq("key", KEY);
    return;
  }
  if (typeof window !== "undefined") localStorage.removeItem(LS);
}
