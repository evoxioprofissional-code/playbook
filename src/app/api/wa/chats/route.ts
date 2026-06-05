import { configFromRequest, evo, extractText } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// Lista de conversas (contatos individuais, sem grupos).
export async function POST(req: Request) {
  const cfg = configFromRequest(req);
  if (!cfg) return Response.json({ error: "WhatsApp não configurado." }, { status: 400 });

  const r = await evo(cfg, `/chat/findChats/${cfg.instance}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (!r.ok) {
    return Response.json({ error: "Falha ao buscar conversas.", detail: r.data }, { status: r.status || 500 });
  }

  const arr: any[] = Array.isArray(r.data)
    ? r.data
    : r.data?.chats || r.data?.records || [];

  const chats = arr
    .filter((c) => typeof c.remoteJid === "string" && c.remoteJid.endsWith("@s.whatsapp.net"))
    .map((c) => {
      const lm = c.lastMessage;
      return {
        jid: c.remoteJid as string,
        number: (c.remoteJid as string).replace(/@.*/, ""),
        name: c.pushName || lm?.pushName || null,
        pic: c.profilePicUrl || null,
        preview: extractText(lm?.message),
        fromMe: Boolean(lm?.key?.fromMe),
        time: c.updatedAt || null,
        unread: Number(c.unreadCount) || 0,
      };
    })
    .sort((a, b) => (b.time || "").localeCompare(a.time || ""))
    .slice(0, 200);

  return Response.json({ chats });
}
