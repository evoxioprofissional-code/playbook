import { configFromRequest, evo } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// Liga o "histórico completo" e desconecta, pra que ao reconectar (novo QR)
// o WhatsApp importe todas as conversas — não só as recentes.
// Não apaga os dados já salvos: só força o sync completo no próximo connect.
export async function POST(req: Request) {
  const cfg = configFromRequest(req);
  if (!cfg) return Response.json({ error: "WhatsApp não configurado." }, { status: 400 });

  // Lê os ajustes atuais pra não sobrescrever os outros.
  const cur = await evo(cfg, `/settings/find/${cfg.instance}`, { method: "GET" });
  const s = (cur.ok && cur.data) || {};
  const settings = {
    rejectCall: Boolean(s.rejectCall),
    msgCall: s.msgCall || "",
    groupsIgnore: Boolean(s.groupsIgnore),
    alwaysOnline: Boolean(s.alwaysOnline),
    readMessages: Boolean(s.readMessages),
    readStatus: Boolean(s.readStatus),
    syncFullHistory: true,
  };
  await evo(cfg, `/settings/set/${cfg.instance}`, {
    method: "POST",
    body: JSON.stringify(settings),
  });

  // Desconecta pra forçar novo pareamento com sync completo.
  await evo(cfg, `/instance/logout/${cfg.instance}`, { method: "DELETE" });

  return Response.json({ ok: true });
}
