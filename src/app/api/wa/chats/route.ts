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

// Lista de conversas. Resolve o nome de várias fontes (contatos, chat, mensagens)
// e mescla com as mensagens recentes pra ficar sempre fresco.
export async function POST(req: Request) {
  const cfg = configFromRequest(req);
  if (!cfg) return Response.json({ error: "WhatsApp não configurado." }, { status: 400 });

  const [r, rc, rm] = await Promise.all([
    evo(cfg, `/chat/findChats/${cfg.instance}`, { method: "POST", body: JSON.stringify({}) }),
    evo(cfg, `/chat/findContacts/${cfg.instance}`, { method: "POST", body: JSON.stringify({}) }),
    evo(cfg, `/chat/findMessages/${cfg.instance}`, { method: "POST", body: JSON.stringify({ limit: 400 }) }),
  ]);
  if (!r.ok) {
    return Response.json({ error: "Falha ao buscar conversas.", detail: r.data }, { status: r.status || 500 });
  }

  const clean = (n?: string | null) => {
    const v = (n || "").trim();
    return v && v !== "Você" ? v : null;
  };
  const isContact = (jid: unknown): jid is string =>
    typeof jid === "string" && (jid.endsWith("@s.whatsapp.net") || jid.endsWith("@lid"));

  // Nome dos contatos (findContacts).
  const contactArr: any[] = Array.isArray(rc.data) ? rc.data : rc.data?.contacts || rc.data?.records || [];
  const nameByJid = new Map<string, string>();
  for (const c of contactArr) {
    const jid = c.remoteJid || c.id;
    const n = clean(c.pushName || c.name);
    if (jid && n) nameByJid.set(jid, n);
  }

  // Mensagens recentes.
  const rawMsgs: any[] = rm.data?.messages?.records
    ? rm.data.messages.records
    : Array.isArray(rm.data?.messages)
      ? rm.data.messages
      : Array.isArray(rm.data)
        ? rm.data
        : [];

  // Nome que vem nas mensagens recebidas (melhor fonte pra @lid).
  const nameFromMsg = new Map<string, string>();
  for (const m of rawMsgs) {
    const jid = m.key?.remoteJid;
    if (!isContact(jid) || m.key?.fromMe) continue;
    const n = clean(m.pushName);
    if (n && !nameFromMsg.has(jid)) nameFromMsg.set(jid, n);
  }

  const resolveName = (jid: string, chatPush?: string | null) =>
    nameByJid.get(jid) || clean(chatPush) || nameFromMsg.get(jid) || null;

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
      name: resolveName(jid, c.pushName),
      pic: c.profilePicUrl || null,
      preview: extractText(lm?.message),
      fromMe: Boolean(lm?.key?.fromMe),
      time: c.updatedAt || null,
      unread: Number(c.unreadCount) || 0,
    });
  }

  // Mescla as mensagens recentes (frescura + conversas que não vieram no findChats).
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
      if (!ex.name) ex.name = resolveName(jid);
    } else {
      map.set(jid, {
        jid,
        number: jid.replace(/@.*/, ""),
        name: resolveName(jid),
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
