import { configFromRequest, evo } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// Desconecta o WhatsApp da instância.
export async function POST(req: Request) {
  const cfg = configFromRequest(req);
  if (!cfg) return Response.json({ error: "Não configurado." }, { status: 400 });

  const r = await evo(cfg, `/instance/logout/${cfg.instance}`, { method: "DELETE" });
  return Response.json({ ok: r.ok });
}
