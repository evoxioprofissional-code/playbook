import { configFromRequest, evo } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// Zera a instância: desconecta, apaga os dados e recria limpa.
// Use ao trocar de número (evita misturar conversas de WhatsApps diferentes).
export async function POST(req: Request) {
  const cfg = configFromRequest(req);
  if (!cfg) return Response.json({ error: "WhatsApp não configurado." }, { status: 400 });

  await evo(cfg, `/instance/logout/${cfg.instance}`, { method: "DELETE" });
  await evo(cfg, `/instance/delete/${cfg.instance}`, { method: "DELETE" });
  await evo(cfg, "/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName: cfg.instance,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
      syncFullHistory: true, // importa o histórico completo ao conectar
    }),
  });
  return Response.json({ ok: true });
}
