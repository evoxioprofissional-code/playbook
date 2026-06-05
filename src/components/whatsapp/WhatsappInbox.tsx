"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Search,
  Power,
  ArrowLeft,
  MessageSquare,
  ImageIcon,
  Mic,
  X,
} from "lucide-react";
import {
  waChats,
  waMessages,
  waSend,
  waSendMedia,
  waMedia,
  waLogout,
  type WaChat,
  type WaMessage,
} from "@/lib/wa";

// Cache de mídia já baixada (id da msg -> data URL), evita rebaixar no polling.
const mediaCache = new Map<string, string>();

const KIND_LABEL: Record<string, string> = {
  image: "Imagem",
  video: "Vídeo",
  audio: "Áudio",
  document: "Documento",
  sticker: "Figurinha",
};

// Lê uma imagem e reduz pra no máx. 1280px (JPEG) — payload leve e confiável.
function readImageResized(file: File): Promise<{ dataUrl: string; mimetype: string; name: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 1280;
        let { width, height } = img;
        if (width > max || height > max) {
          const scale = Math.min(max / width, max / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve({
          dataUrl: canvas.toDataURL("image/jpeg", 0.82),
          mimetype: "image/jpeg",
          name: file.name.replace(/\.\w+$/, "") + ".jpg",
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(blob);
  });
}

function initials(name: string | null, number: string) {
  const base = (name || number).trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

function chatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function msgTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WhatsappInbox({ onDisconnect }: { onDisconnect: () => void }) {
  const [chats, setChats] = useState<WaChat[]>([]);
  const [active, setActive] = useState<WaChat | null>(null);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [text, setText] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [q, setQ] = useState("");
  const [attach, setAttach] = useState<{ dataUrl: string; mimetype: string; name: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelRef = useRef(false);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lista de conversas + atualização automática.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const r = await waChats();
      if (alive && r.chats) {
        setChats(r.chats);
        setLoadingChats(false);
      }
    };
    load();
    const id = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Mensagens da conversa aberta + atualização automática.
  useEffect(() => {
    if (!active) {
      setMessages([]);
      return;
    }
    let alive = true;
    setLoadingMsgs(true);
    const load = async () => {
      const r = await waMessages(active.jid);
      if (alive && r.messages) {
        setMessages(r.messages);
        setLoadingMsgs(false);
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [active?.jid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, active?.jid]);

  async function reload() {
    if (!active) return;
    const r = await waMessages(active.jid);
    if (r.messages) setMessages(r.messages);
  }

  function optimistic(text: string) {
    setMessages((m) => [
      ...m,
      { id: `tmp-${Date.now()}`, fromMe: true, kind: "text", text, ts: Math.floor(Date.now() / 1000) },
    ]);
  }

  async function send() {
    if (!active || sending) return;
    const t = text.trim();

    // Com imagem anexada: envia a imagem (legenda = texto).
    if (attach) {
      setSending(true);
      optimistic(t ? `📷 ${t}` : "📷 Imagem");
      setText("");
      const a = attach;
      setAttach(null);
      await waSendMedia({
        number: active.number,
        kind: "image",
        mediatype: "image",
        mimetype: a.mimetype,
        media: a.dataUrl,
        fileName: a.name,
        caption: t,
      });
      setSending(false);
      reload();
      return;
    }

    if (!t) return;
    setSending(true);
    optimistic(t);
    setText("");
    await waSend(active.number, t);
    setSending(false);
    reload();
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const img = await readImageResized(file);
      setAttach(img);
    } catch {
      /* ignora arquivo inválido */
    }
  }

  async function startRec() {
    if (!active) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      cancelRef.current = false;
      mr.ondataavailable = (ev) => ev.data.size && chunksRef.current.push(ev.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recTimerRef.current) clearInterval(recTimerRef.current);
        setRecording(false);
        setRecSecs(0);
        if (cancelRef.current) return;
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const b64 = await blobToBase64(blob);
        setSending(true);
        optimistic("🎤 Áudio");
        await waSendMedia({ number: active.number, kind: "audio", media: b64 });
        setSending(false);
        reload();
      };
      mr.start();
      recRef.current = mr;
      setRecording(true);
      setRecSecs(0);
      recTimerRef.current = setInterval(() => setRecSecs((s) => s + 1), 1000);
    } catch {
      alert("Não consegui acessar o microfone. Permita o acesso no navegador.");
    }
  }

  function stopRec(cancel: boolean) {
    cancelRef.current = cancel;
    recRef.current?.stop();
  }

  async function disconnect() {
    await waLogout();
    onDisconnect();
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return chats;
    const digits = s.replace(/\D/g, "");
    return chats.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(s) ||
        (digits && c.number.includes(digits))
    );
  }, [chats, q]);

  return (
    <div className="flex h-[calc(100vh-89px)] flex-col">
      {/* Barra de status */}
      <div className="flex items-center justify-between border-b border-ink-700 px-6 py-2 sm:px-8">
        <span className="flex items-center gap-2 text-xs font-bold text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Conectado
          <span className="font-normal text-zinc-500">· {chats.length} conversas</span>
        </span>
        <button
          onClick={disconnect}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-2.5 py-1.5 text-xs font-semibold text-rose-300 ring-1 ring-ink-700 hover:text-rose-200"
        >
          <Power size={14} /> Desconectar
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Lista de conversas */}
        <aside
          className={`${active ? "hidden md:flex" : "flex"} w-full flex-col border-r border-ink-700 md:w-80`}
        >
          <div className="p-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-2.5 text-zinc-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar conversa…"
                className="w-full rounded-xl border border-ink-700 bg-ink-950 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-flame-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingChats ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">Carregando…</p>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">Nenhuma conversa.</p>
            ) : (
              filtered.map((c) => {
                const isActive = active?.jid === c.jid;
                return (
                  <button
                    key={c.jid}
                    onClick={() => setActive(c)}
                    className={`flex w-full items-center gap-3 border-b border-ink-800/60 px-4 py-3 text-left transition ${
                      isActive ? "bg-ink-800" : "hover:bg-ink-900"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-zinc-200">
                      {initials(c.name, c.number)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-white">
                          {c.name || `+${c.number}`}
                        </span>
                        <span className="shrink-0 text-[10px] text-zinc-500">
                          {chatTime(c.time)}
                        </span>
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-zinc-500">
                          {c.fromMe ? "Você: " : ""}
                          {c.preview}
                        </span>
                        {c.unread > 0 && (
                          <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-black">
                            {c.unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Conversa */}
        <section className={`${active ? "flex" : "hidden md:flex"} flex-1 flex-col bg-ink-950/40`}>
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center text-zinc-600">
              <MessageSquare size={40} />
              <p className="mt-2 text-sm">Selecione uma conversa</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho da conversa */}
              <div className="flex items-center gap-3 border-b border-ink-700 px-4 py-3">
                <button
                  onClick={() => setActive(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:text-white md:hidden"
                >
                  <ArrowLeft size={18} />
                </button>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-zinc-200">
                  {initials(active.name, active.number)}
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-bold text-white">
                    {active.name || `+${active.number}`}
                  </p>
                  <p className="text-[11px] text-zinc-500">+{active.number}</p>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
                {loadingMsgs && messages.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-500">Carregando mensagens…</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-2 py-2 text-sm ${
                          m.fromMe
                            ? "rounded-br-sm bg-emerald-600/90 text-white"
                            : "rounded-bl-sm bg-ink-800 text-zinc-100"
                        }`}
                      >
                        {m.kind === "text" ? (
                          <p className="whitespace-pre-wrap break-words px-1">{m.text}</p>
                        ) : (
                          <>
                            <MediaBubble msg={m} />
                            {m.caption && (
                              <p className="whitespace-pre-wrap break-words px-1 pt-1">
                                {m.caption}
                              </p>
                            )}
                          </>
                        )}
                        <p
                          className={`mt-0.5 px-1 text-right text-[10px] ${
                            m.fromMe ? "text-emerald-100/70" : "text-zinc-500"
                          }`}
                        >
                          {msgTime(m.ts)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={endRef} />
              </div>

              {/* Composer */}
              <div className="border-t border-ink-700 p-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickImage}
                />

                {attach && (
                  <div className="mb-2 flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={attach.dataUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    <span className="flex-1 text-xs text-zinc-400">
                      Imagem pronta — escreva uma legenda (opcional) e envie.
                    </span>
                    <button
                      onClick={() => setAttach(null)}
                      className="rounded-lg p-1 text-zinc-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {recording ? (
                  <div className="flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm font-bold text-rose-300">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
                      Gravando {Math.floor(recSecs / 60)}:{String(recSecs % 60).padStart(2, "0")}
                    </span>
                    <span className="flex-1" />
                    <button
                      onClick={() => stopRec(true)}
                      className="rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => stopRec(false)}
                      title="Enviar áudio"
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-black hover:bg-emerald-400"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => fileRef.current?.click()}
                      title="Enviar imagem"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-zinc-300 ring-1 ring-ink-700 hover:text-flame-400"
                    >
                      <ImageIcon size={18} />
                    </button>
                    <button
                      onClick={startRec}
                      title="Gravar áudio"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-zinc-300 ring-1 ring-ink-700 hover:text-emerald-400"
                    >
                      <Mic size={18} />
                    </button>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      rows={1}
                      placeholder={attach ? "Legenda (opcional)…" : "Escreva uma mensagem…"}
                      className="max-h-32 flex-1 resize-none rounded-xl border border-ink-700 bg-ink-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500"
                    />
                    <button
                      onClick={send}
                      disabled={(!text.trim() && !attach) || sending}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-black transition hover:bg-emerald-400 disabled:opacity-40"
                    >
                      <Send size={17} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function MediaBubble({ msg }: { msg: WaMessage }) {
  const [url, setUrl] = useState<string | null>(mediaCache.get(msg.id) || null);
  const [state, setState] = useState<"loading" | "ready" | "error">(
    mediaCache.get(msg.id) ? "ready" : "loading"
  );

  useEffect(() => {
    if (mediaCache.get(msg.id)) return;
    let alive = true;
    setState("loading");
    waMedia(msg.id).then((r) => {
      if (!alive) return;
      if (r.base64) {
        const dataUrl = `data:${r.mimetype || msg.mimetype || "application/octet-stream"};base64,${r.base64}`;
        mediaCache.set(msg.id, dataUrl);
        setUrl(dataUrl);
        setState("ready");
      } else {
        setState("error");
      }
    });
    return () => {
      alive = false;
    };
  }, [msg.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "loading") {
    return (
      <div className="flex h-28 w-44 items-center justify-center rounded-lg bg-black/20 text-xs text-zinc-300">
        Carregando {KIND_LABEL[msg.kind]?.toLowerCase()}…
      </div>
    );
  }
  if (state === "error" || !url) {
    return (
      <p className="px-1 text-sm opacity-80">
        {KIND_LABEL[msg.kind] || "Mídia"} (não foi possível carregar)
      </p>
    );
  }

  if (msg.kind === "image" || msg.kind === "sticker") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="max-h-72 rounded-lg" />
      </a>
    );
  }
  if (msg.kind === "video") {
    return <video src={url} controls className="max-h-72 rounded-lg" />;
  }
  if (msg.kind === "audio") {
    return <audio src={url} controls className="w-56" />;
  }
  return (
    <a href={url} download className="flex items-center gap-2 px-1 text-sm underline">
      📄 Baixar {msg.caption || "documento"}
    </a>
  );
}
