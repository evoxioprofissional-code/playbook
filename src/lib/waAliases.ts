// Apelidos das conversas do WhatsApp.
// O WhatsApp esconde o nome/telefone de quem não está salvo (privacidade @lid),
// então a equipe pode renomear cada conversa aqui. Fica salvo no Supabase e
// aparece pra todo mundo. Sem Supabase, cai no localStorage (só nesse navegador).

import { supabase, isSupabaseEnabled } from "./supabase";

const LS = "j2a_wa_aliases";

function readLocal(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS) || "{}");
  } catch {
    return {};
  }
}

function writeLocal(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS, JSON.stringify(map));
}

export async function fetchAliases(): Promise<Record<string, string>> {
  if (!isSupabaseEnabled || !supabase) return readLocal();
  const { data, error } = await supabase.from("wa_aliases").select("jid, name");
  if (error || !data) return readLocal();
  const map: Record<string, string> = {};
  for (const r of data) if (r.jid && r.name) map[r.jid] = r.name;
  return map;
}

export async function setAlias(jid: string, name: string): Promise<void> {
  const clean = name.trim();
  if (!isSupabaseEnabled || !supabase) {
    const map = readLocal();
    if (clean) map[jid] = clean;
    else delete map[jid];
    writeLocal(map);
    return;
  }
  if (clean) {
    await supabase.from("wa_aliases").upsert({ jid, name: clean, updated_at: new Date().toISOString() });
  } else {
    await supabase.from("wa_aliases").delete().eq("jid", jid);
  }
}
