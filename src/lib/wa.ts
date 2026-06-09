// Cliente do WhatsApp (lado do navegador): guarda a config e chama as rotas /api/wa/*.

export type WaConfig = { url: string; key: string; instance: string };

const LS = "j2a_wa_cfg";

export function getWaConfig(): WaConfig {
  if (typeof window === "undefined") return { url: "", key: "", instance: "" };
  try {
    const c = JSON.parse(localStorage.getItem(LS) || "{}");
    return { url: c.url || "", key: c.key || "", instance: c.instance || "" };
  } catch {
    return { url: "", key: "", instance: "" };
  }
}

export function setWaConfig(c: WaConfig) {
  localStorage.setItem(LS, JSON.stringify(c));
}

export function isWaConfigured(): boolean {
  const c = getWaConfig();
  return Boolean(c.url && c.key && c.instance);
}

function headers(extra?: Record<string, string>): Record<string, string> {
  const c = getWaConfig();
  const h: Record<string, string> = { ...(extra || {}) };
  if (c.url) h["x-evo-url"] = c.url;
  if (c.key) h["x-evo-key"] = c.key;
  if (c.instance) h["x-evo-instance"] = c.instance;
  return h;
}

export async function waStatus(): Promise<{ state: string }> {
  try {
    const r = await fetch("/api/wa/status", { headers: headers(), cache: "no-store" });
    return await r.json();
  } catch {
    return { state: "error" };
  }
}

export async function waConnect(): Promise<{ base64?: string; code?: string; error?: string }> {
  const r = await fetch("/api/wa/connect", { method: "POST", headers: headers() });
  return r.json();
}

export async function waSend(number: string, text: string): Promise<{ ok?: boolean; error?: string }> {
  const r = await fetch("/api/wa/send", {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ number, text }),
  });
  return r.json();
}

export type WaChat = {
  jid: string;
  number: string;
  name: string | null;
  pic: string | null;
  preview: string;
  fromMe: boolean;
  time: string | null;
  unread: number;
};

export type WaMediaKind = "text" | "image" | "video" | "audio" | "document" | "sticker";

export type WaMessage = {
  id: string;
  fromMe: boolean;
  kind: WaMediaKind;
  text: string;
  caption?: string;
  mimetype?: string;
  ts: number;
};

export async function waMedia(id: string): Promise<{ base64?: string; mimetype?: string; error?: string }> {
  try {
    const r = await fetch("/api/wa/media", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ id }),
      cache: "no-store",
    });
    return await r.json();
  } catch {
    return { error: "Sem conexão" };
  }
}

export async function waChats(): Promise<{ chats?: WaChat[]; error?: string }> {
  try {
    const r = await fetch("/api/wa/chats", { method: "POST", headers: headers(), cache: "no-store" });
    return await r.json();
  } catch {
    return { error: "Sem conexão" };
  }
}

export async function waMessages(jid: string): Promise<{ messages?: WaMessage[]; error?: string }> {
  try {
    const r = await fetch("/api/wa/messages", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ jid }),
      cache: "no-store",
    });
    return await r.json();
  } catch {
    return { error: "Sem conexão" };
  }
}

export type WaMediaPayload = {
  number: string;
  kind: "image" | "audio" | "document" | "video";
  media: string; // base64 (com ou sem prefixo data:)
  mediatype?: string;
  mimetype?: string;
  fileName?: string;
  caption?: string;
};

export async function waSendMedia(p: WaMediaPayload): Promise<{ ok?: boolean; error?: string }> {
  try {
    const r = await fetch("/api/wa/sendmedia", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(p),
    });
    return await r.json();
  } catch {
    return { error: "Sem conexão" };
  }
}

export async function waLogout(): Promise<{ ok?: boolean }> {
  const r = await fetch("/api/wa/logout", { method: "POST", headers: headers() });
  return r.json();
}

export async function waReset(): Promise<{ ok?: boolean }> {
  const r = await fetch("/api/wa/reset", { method: "POST", headers: headers() });
  return r.json();
}

/** Fallback: link wa.me (abre o WhatsApp com a mensagem pronta). */
export function waLink(phone: string | undefined, text: string) {
  const digits = (phone || "").replace(/\D/g, "");
  let num = "";
  if (digits) num = digits.startsWith("55") ? digits : digits.length <= 11 ? `55${digits}` : digits;
  const t = encodeURIComponent(text);
  return num ? `https://wa.me/${num}?text=${t}` : `https://wa.me/?text=${t}`;
}
