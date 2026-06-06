import { configFromRequest, evo, resolveRecipient } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// Envia uma mensagem de texto pelo número conectado.
export async function POST(req: Request) {
  const cfg = configFromRequest(req);
  if (!cfg) {
    return Response.json({ error: "WhatsApp não configurado." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const number = resolveRecipient(body.number || "");
  const text = (body.text || "").toString();

  if (!number) return Response.json({ error: "Número do cliente vazio." }, { status: 400 });
  if (!text) return Response.json({ error: "Mensagem vazia." }, { status: 400 });

  const r = await evo(cfg, `/message/sendText/${cfg.instance}`, {
    method: "POST",
    body: JSON.stringify({ number, text }),
  });

  if (!r.ok) {
    return Response.json(
      { error: "Falha ao enviar. O WhatsApp está conectado?", detail: r.data },
      { status: r.status || 500 }
    );
  }
  return Response.json({ ok: true });
}
