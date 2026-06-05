import { configFromRequest, evo, extractText } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// Mensagens de uma conversa (ordenadas da mais antiga pra mais recente).
export async function POST(req: Request) {
  const cfg = configFromRequest(req);
  if (!cfg) return Response.json({ error: "WhatsApp não configurado." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const jid = body.jid as string;
  if (!jid) return Response.json({ error: "Conversa não informada." }, { status: 400 });

  const r = await evo(cfg, `/chat/findMessages/${cfg.instance}`, {
    method: "POST",
    body: JSON.stringify({ where: { key: { remoteJid: jid } } }),
  });
  if (!r.ok) {
    return Response.json({ error: "Falha ao buscar mensagens.", detail: r.data }, { status: r.status || 500 });
  }

  const raw: any[] = r.data?.messages?.records
    ? r.data.messages.records
    : Array.isArray(r.data?.messages)
      ? r.data.messages
      : Array.isArray(r.data)
        ? r.data
        : [];

  const messages = raw
    .map((m) => ({
      id: m.key?.id || `${m.messageTimestamp}-${Math.random()}`,
      fromMe: Boolean(m.key?.fromMe),
      text: extractText(m.message),
      ts: Number(m.messageTimestamp) || 0,
    }))
    .sort((a, b) => a.ts - b.ts);

  return Response.json({ messages });
}
