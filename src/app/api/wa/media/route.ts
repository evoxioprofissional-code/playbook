import { configFromRequest, evo } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// Baixa e descriptografa a mídia de uma mensagem (retorna base64).
export async function POST(req: Request) {
  const cfg = configFromRequest(req);
  if (!cfg) return Response.json({ error: "WhatsApp não configurado." }, { status: 400 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return Response.json({ error: "Mensagem não informada." }, { status: 400 });

  const r = await evo(cfg, `/chat/getBase64FromMediaMessage/${cfg.instance}`, {
    method: "POST",
    body: JSON.stringify({ message: { key: { id } }, convertToMp4: false }),
  });
  if (!r.ok || !r.data?.base64) {
    return Response.json({ error: "Falha ao baixar a mídia.", detail: r.data }, { status: r.status || 500 });
  }
  return Response.json({ base64: r.data.base64, mimetype: r.data.mimetype || "" });
}
