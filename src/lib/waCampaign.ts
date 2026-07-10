// Campanha de recuperação em massa pelo WhatsApp.
// Guardada no Supabase pra sobreviver a recarregar a página. O envio é feito
// pelo app (CampaignRunner): 1 mensagem a cada `interval_min` minutos, com
// "claim" atômico pra duas abas/aparelhos nunca enviarem a mesma duas vezes.

import { supabase, isSupabaseEnabled } from "./supabase";
import { waSend, currentInstance } from "./wa";

export type CampaignTarget = {
  id: string;
  campaign_id: string;
  jid: string;
  name: string | null;
  status: "pending" | "sending" | "sent" | "error";
  sent_at: string | null;
};

/** Tipo de disparo — casa com os grupos do Radar. */
export type DispatchKind = "responder" | "followup" | "recuperacao";

export type Campaign = {
  id: string;
  message: string;
  interval_min: number;
  interval_sec: number;
  kind: DispatchKind;
  status: "running" | "done" | "canceled";
  created_at: string;
};

export type CampaignState = {
  campaign: Campaign;
  total: number;
  sent: number;
  errors: number;
  pending: number;
  intervalSec: number;
  nextInSec: number | null; // segundos até o próximo envio (0 = já vai)
};

/** Traduz erros de rede do Supabase numa mensagem clara pro usuário. */
function friendlyDbError(msg?: string): string {
  if (msg && /failed to fetch|networkerror|fetch failed|load failed/i.test(msg)) {
    return "Sem conexão com o banco de dados. O projeto Supabase pode estar pausado — reative no painel do Supabase e tente de novo.";
  }
  return msg || "Falha ao salvar.";
}

/** Preenche {cliente} pelo nome do contato no momento do envio. */
function fillClient(message: string, name: string | null) {
  return message.replace(/\{cliente\}/gi, (name || "").trim() || "tudo bem");
}

/** Cria a campanha e os alvos (deduplica por jid). */
export async function createCampaign(input: {
  message: string;
  intervalSec: number;
  kind: DispatchKind;
  targets: { jid: string; name?: string | null }[];
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (!isSupabaseEnabled || !supabase) return { ok: false, error: "Supabase não conectado." };

  const seen = new Set<string>();
  const targets = input.targets.filter((t) => t.jid && !seen.has(t.jid) && seen.add(t.jid));
  if (!targets.length) return { ok: false, error: "Nenhum contato para recuperar." };

  const intervalSec = Math.max(1, Math.round(input.intervalSec));
  try {
    const { data: camp, error } = await supabase
      .from("wa_campaigns")
      .insert({
        message: input.message,
        interval_sec: intervalSec,
        interval_min: Math.max(1, Math.round(intervalSec / 60)),
        instance: currentInstance() || null,
        kind: input.kind,
      })
      .select()
      .single();
    if (error || !camp) return { ok: false, error: friendlyDbError(error?.message) };

    const rows = targets.map((t) => ({ campaign_id: camp.id, jid: t.jid, name: t.name || null }));
    const { error: te } = await supabase.from("wa_campaign_targets").insert(rows);
    if (te) return { ok: false, error: friendlyDbError(te.message) };

    if (typeof window !== "undefined") window.dispatchEvent(new Event("j2a-campaign-started"));
    return { ok: true, id: camp.id };
  } catch (e) {
    return { ok: false, error: friendlyDbError(e instanceof Error ? e.message : String(e)) };
  }
}

/** Intervalo efetivo da campanha em segundos (com fallback p/ registros antigos). */
function campaignSec(c: Campaign) {
  return c.interval_sec || (c.interval_min || 8) * 60;
}

/** Estado da campanha em andamento (pra mostrar progresso). Só do vendedor logado. */
export async function fetchActiveCampaign(): Promise<CampaignState | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const inst = currentInstance();
  if (!inst) return null;
  const { data: camps } = await supabase
    .from("wa_campaigns")
    .select("*")
    .eq("status", "running")
    .eq("instance", inst)
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
  const intervalSec = campaignSec(campaign);
  const gapMs = intervalSec * 1000;
  const nextInSec =
    pending === 0 ? null : !lastSent ? 0 : Math.max(0, Math.ceil((lastSent + gapMs - Date.now()) / 1000));

  return { campaign, total: targets.length, sent, errors, pending, intervalSec, nextInSec };
}

export type DispatchInfo = { kind: DispatchKind; at: string };

/** Mapa jid -> último disparo feito (tipo + data), do vendedor logado. */
export async function fetchDispatchedJids(): Promise<Record<string, DispatchInfo>> {
  if (!isSupabaseEnabled || !supabase) return {};
  const inst = currentInstance();
  if (!inst) return {};
  // Campanhas deste vendedor (id -> tipo).
  const { data: camps } = await supabase
    .from("wa_campaigns")
    .select("id, kind")
    .eq("instance", inst);
  const kindById = new Map<string, DispatchKind>();
  for (const c of (camps || []) as { id: string; kind: DispatchKind }[]) kindById.set(c.id, c.kind);
  if (!kindById.size) return {};

  const { data } = await supabase
    .from("wa_campaign_targets")
    .select("jid, sent_at, campaign_id")
    .eq("status", "sent")
    .in("campaign_id", Array.from(kindById.keys()));

  const map: Record<string, DispatchInfo> = {};
  for (const r of (data || []) as { jid: string; sent_at: string | null; campaign_id: string }[]) {
    if (!r.jid || !r.sent_at) continue;
    const kind = kindById.get(r.campaign_id) || "recuperacao";
    if (!map[r.jid] || r.sent_at > map[r.jid].at) map[r.jid] = { kind, at: r.sent_at };
  }
  return map;
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
  const inst = currentInstance();
  if (!inst) return;

  const { data: camps } = await supabase
    .from("wa_campaigns")
    .select("*")
    .eq("status", "running")
    .eq("instance", inst)
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
  if (lastSent && Date.now() - lastSent < campaignSec(camp) * 1000) return;

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
