import { configFromRequest, evo, extractText } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// Lista de conversas (contatos individuais, sem grupos).
export async function POST(req: Request) {
  const cfg = configFromRequest(req);
  if (!cfg) return Response.json({ error: "WhatsApp não configurado." }, { status: 400 });

  // Busca conversas e contatos em paralelo (contatos têm o nome real).
  const [r, rc] = await Promise.all([
    evo(cfg, `/chat/findChats/${cfg.instance}`, { method: "POST", body: JSON.stringify({}) }),
    evo(cfg, `/chat/findContacts/${cfg.instance}`, { method: "POST", body: JSON.stringify({}) }),
  ]);
  if (!r.ok) {
    return Response.json({ error: "Falha ao buscar conversas.", detail: r.data }, { status: r.status || 500 });
  }

  // Mapa jid -> nome real do contato.
  const contactArr: any[] = Array.isArray(rc.data)
    ? rc.data
    : rc.data?.contacts || rc.data?.records || [];
  const nameByJid = new Map<string, string>();
  for (const c of contactArr) {
    const jid = c.remoteJid || c.id;
    const n = (c.pushName || c.name || "").trim();
    if (jid && n && n !== "Você") nameByJid.set(jid, n);
  }

  const clean = (n?: string | null) => {
    const v = (n || "").trim();
    return v && v !== "Você" ? v : null;
  };

  const arr: any[] = Array.isArray(r.data)
    ? r.data
    : r.data?.chats || r.data?.records || [];

  const chats = arr
    .filter((c) => typeof c.remoteJid === "string" && c.remoteJid.endsWith("@s.whatsapp.net"))
    .map((c) => {
      const lm = c.lastMessage;
      const jid = c.remoteJid as string;
      return {
        jid,
        number: jid.replace(/@.*/, ""),
        name: nameByJid.get(jid) || clean(c.pushName),
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
