import { configFromRequest, evo } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// Garante a instância e devolve o QR code (base64) pra escanear no app.
export async function POST(req: Request) {
  const cfg = configFromRequest(req);
  if (!cfg) {
    return Response.json(
      { error: "Configure a URL do servidor, a API key e o nome da instância." },
      { status: 400 }
    );
  }

  // Cria a instância (se já existir, o Evolution responde erro e a gente ignora).
  await evo(cfg, "/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName: cfg.instance,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });

  // Busca o QR atual.
  const r = await evo(cfg, `/instance/connect/${cfg.instance}`, { method: "GET" });
  if (!r.ok) {
    return Response.json(
      { error: "Não consegui gerar o QR.", detail: r.data },
      { status: r.status || 500 }
    );
  }

  const base64 = r.data?.base64 || r.data?.qrcode?.base64 || null;
  const code = r.data?.code || r.data?.qrcode?.code || r.data?.pairingCode || null;
  return Response.json({ base64, code });
}
