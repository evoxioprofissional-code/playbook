import { configFromRequest, evo, extractText } from "@/lib/evolution";

export const dynamic = "force-dynamic";

type Chat = {
  jid: string;
  number: string;
  name: string | null;
  pic: string | null;
  preview: string;
  fromMe: boolean;
  time: string | null;
  unread: number;
};

// Lista de conversas. Combina findChats (lista completa + não lidas)
// com as mensagens recentes (sempre frescas) — assim mensagem nova,
// inclusive de número novo, sobe na lista mesmo que o findChats trave.
export async function POST(req: Request) {
  const cfg = configFromRequest(req);
  if (!cfg) return Response.json({ error: "WhatsApp não configurado." }, { status: 400 });

  const [r, rc, rm] = await Promise.all([
    evo(cfg, `/chat/findChats/${cfg.instance}`, { method: "POST", body: JSON.stringify({}) }),
    evo(cfg, `/chat/findContacts/${cfg.instance}`, { method: "POST", body: JSON.stringify({}) }),
    evo(cfg, `/chat/findMessages/${cfg.instance}`, { method: "POST", body: JSON.stringify({ limit: 300 }) }),
  ]);
  if (!r.ok) {
    return Response.json({ error: "Falha ao buscar conversas.", detail: r.data }, { status: r.status || 500 });
  }

  // Nomes reais dos contatos.
  const contactArr: any[] = Array.isArray(rc.data) ? rc.data : rc.data?.contacts || rc.data?.records || [];
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
  // Individual = contato normal (@s.whatsapp.net) ou ID novo de privacidade (@lid).
  // Exclui grupos (@g.us), status e broadcast.
  const isContact = (jid: unknown): jid is string =>
    typeof jid === "string" &&
    (jid.endsWith("@s.whatsapp.net") || jid.endsWith("@lid"));

  // Base: findChats.
  const map = new Map<string, Chat>();
  const chatArr: any[] = Array.isArray(r.data) ? r.data : r.data?.chats || r.data?.records || [];
  for (const c of chatArr) {
    const jid = c.remoteJid;
    if (!isContact(jid)) continue;
    const lm = c.lastMessage;
    map.set(jid, {
      jid,
      number: jid.replace(/@.*/, ""),
      name: nameByJid.get(jid) || clean(c.pushName),
      pic: c.profilePicUrl || null,
      preview: extractText(lm?.message),
      fromMe: Boolean(lm?.key?.fromMe),
      time: c.updatedAt || null,
      unread: Number(c.unreadCount) || 0,
    });
  }

  // Mescla com as mensagens recentes (mais frescas que o findChats).
  const rawMsgs: any[] = rm.data?.messages?.records
    ? rm.data.messages.records
    : Array.isArray(rm.data?.messages)
      ? rm.data.messages
      : Array.isArray(rm.data)
        ? rm.data
        : [];

  const latest = new Map<string, { ts: number; msg: any }>();
  for (const m of rawMsgs) {
    const jid = m.key?.remoteJid;
    if (!isContact(jid)) continue;
    const ts = Number(m.messageTimestamp) || 0;
    const ex = latest.get(jid);
    if (!ex || ts > ex.ts) latest.set(jid, { ts, msg: m });
  }

  latest.forEach(({ ts, msg }, jid) => {
    const iso = new Date(ts * 1000).toISOString();
    const ex = map.get(jid);
    if (ex) {
      if (!ex.time || iso > ex.time) {
        ex.time = iso;
        ex.preview = extractText(msg.message);
        ex.fromMe = Boolean(msg.key?.fromMe);
      }
    } else {
      map.set(jid, {
        jid,
        number: jid.replace(/@.*/, ""),
        name: nameByJid.get(jid) || null,
        pic: null,
        preview: extractText(msg.message),
        fromMe: Boolean(msg.key?.fromMe),
        time: iso,
        unread: 0,
      });
    }
  });

  const chats = Array.from(map.values())
    .sort((a, b) => (b.time || "").localeCompare(a.time || ""))
    .slice(0, 200);

  return Response.json({ chats });
}
