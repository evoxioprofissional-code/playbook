// Campanha de recuperação em massa pelo WhatsApp.
// Guardada no Supabase pra sobreviver a recarregar a página. O envio é feito
// pelo app (CampaignRunner): 1 mensagem a cada `interval_min` minutos, com
// "claim" atômico pra duas abas/aparelhos nunca enviarem a mesma duas vezes.

import { supabase, isSupabaseEnabled } from "./supabase";
import { waSend } from "./wa";

export type CampaignTarget = {
  id: string;
  campaign_id: string;
  jid: string;
  name: string | null;
  status: "pending" | "sending" | "sent" | "error";
  sent_at: string | null;
};

export type Campaign = {
  id: string;
  message: string;
  interval_min: number;
  status: "running" | "done" | "canceled";
  created_at: string;
};

export type CampaignState = {
  campaign: Campaign;
  total: number;
  sent: number;
  errors: number;
  pending: number;
  nextInMin: number | null; // minutos até o próximo envio (0 = já vai)
};

/** Preenche {cliente} pelo nome do contato no momento do envio. */
function fillClient(message: string, name: string | null) {
  return message.replace(/\{cliente\}/gi, (name || "").trim() || "tudo bem");
}

/** Cria a campanha e os alvos (deduplica por jid). */
export async function createCampaign(input: {
  message: string;
  intervalMin: number;
  targets: { jid: string; name?: string | null }[];
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (!isSupabaseEnabled || !supabase) return { ok: false, error: "Supabase não conectado." };

  const seen = new Set<string>();
  const targets = input.targets.filter((t) => t.jid && !seen.has(t.jid) && seen.add(t.jid));
  if (!targets.length) return { ok: false, error: "Nenhum contato para recuperar." };

  const { data: camp, error } = await supabase
    .from("wa_campaigns")
    .insert({ message: input.message, interval_min: Math.max(1, input.intervalMin) })
    .select()
    .single();
  if (error || !camp) return { ok: false, error: error?.message || "Falha ao criar campanha." };

  const rows = targets.map((t) => ({ campaign_id: camp.id, jid: t.jid, name: t.name || null }));
  const { error: te } = await supabase.from("wa_campaign_targets").insert(rows);
  if (te) return { ok: false, error: te.message };

  return { ok: true, id: camp.id };
}

/** Estado da campanha em andamento (pra mostrar progresso). */
export async function fetchActiveCampaign(): Promise<CampaignState | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const { data: camps } = await supabase
    .from("wa_campaigns")
    .select("*")
    .eq("status", "running")
    .order("created_at", { ascending: true })
    .limit(1);
  const campaign = camps?.[0] as Campaign | undefined;
  if (!campaign) return null;

  const { data: tgts } = await supabase
    .from("wa_campaign_targets")
    .select("*")
    .eq("campaign_id", campaign.id);
  const targets = (tgts || []) as CampaignTarget[];

  const sent = targets.filter((t) => t.status === "sent").length;
  const errors = targets.filter((t) => t.status === "error").length;
  const pending = targets.filter((t) => t.status === "pending" || t.status === "sending").length;
  const lastSent = targets
    .filter((t) => t.sent_at)
    .reduce((m, t) => Math.max(m, new Date(t.sent_at as string).getTime()), 0);
  const gapMs = campaign.interval_min * 60_000;
  const nextInMin =
    pending === 0 ? null : !lastSent ? 0 : Math.max(0, Math.ceil((lastSent + gapMs - Date.now()) / 60_000));

  return { campaign, total: targets.length, sent, errors, pending, nextInMin };
}

export async function cancelCampaign(id: string): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  await supabase.from("wa_campaigns").update({ status: "canceled" }).eq("id", id);
}

/**
 * Processa um passo da campanha: se já passou o intervalo desde o último envio,
 * "reivindica" o próximo alvo pendente (de forma atômica) e envia.
 * Seguro pra rodar em paralelo em várias abas.
 */
export async function tickCampaign(): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;

  const { data: camps } = await supabase
    .from("wa_campaigns")
    .select("*")
    .eq("status", "running")
    .order("created_at", { ascending: true })
    .limit(1);
  const camp = camps?.[0] as Campaign | undefined;
  if (!camp) return;

  const { data: tgts } = await supabase
    .from("wa_campaign_targets")
    .select("*")
    .eq("campaign_id", camp.id);
  const targets = (tgts || []) as CampaignTarget[];

  const pending = targets
    .filter((t) => t.status === "pending")
    .sort((a, b) => a.id.localeCompare(b.id));

  if (!pending.length) {
    // Nada pendente: se também não há nada "sending", encerra.
    if (!targets.some((t) => t.status === "sending")) {
      await supabase.from("wa_campaigns").update({ status: "done" }).eq("id", camp.id);
    }
    return;
  }

  // Respeita o intervalo desde o último envio (anti-ban).
  const lastSent = targets
    .filter((t) => t.sent_at)
    .reduce((m, t) => Math.max(m, new Date(t.sent_at as string).getTime()), 0);
  if (lastSent && Date.now() - lastSent < camp.interval_min * 60_000) return;

  // Claim atômico: só uma aba consegue mudar de 'pending' p/ 'sending'.
  const next = pending[0];
  const { data: claimed } = await supabase
    .from("wa_campaign_targets")
    .update({ status: "sending", sent_at: new Date().toISOString() })
    .eq("id", next.id)
    .eq("status", "pending")
    .select();
  if (!claimed || !claimed.length) return; // outra aba pegou esse

  const text = fillClient(camp.message, next.name);
  const r = await waSend(next.jid, text);
  await supabase
    .from("wa_campaign_targets")
    .update({ status: r.error ? "error" : "sent" })
    .eq("id", next.id);
}
