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
  Radar,
  ChevronDown,
  Zap,
  Plus,
  Trash2,
  Check,
  FileText,
  X,
} from "lucide-react";
import ScriptsDrawer from "./ScriptsDrawer";
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

function chatLabel(c: { name: string | null; number: string; jid: string }) {
  if (c.name) return c.name;
  if (c.jid.endsWith("@lid")) return `Contato ${c.number.slice(-4)}`;
  return `+${c.number}`;
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
  const [view, setView] = useState<"chats" | "radar">("chats");
  const [attach, setAttach] = useState<{ dataUrl: string; mimetype: string; name: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [quickOpen, setQuickOpen] = useState(false);
  const [micOpen, setMicOpen] = useState(false);
  const [scriptsOpen, setScriptsOpen] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [newReply, setNewReply] = useState("");
  const [mics, setMics] = useState<{ id: string; label: string }[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>("default");
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

  // Carrega as respostas rápidas salvas.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("j2a_quick_replies");
      if (raw) setQuickReplies(JSON.parse(raw));
    } catch {
      /* ignora */
    }
  }, []);

  function saveQuick(list: string[]) {
    setQuickReplies(list);
    localStorage.setItem("j2a_quick_replies", JSON.stringify(list));
  }
  function addQuickReply() {
    const v = newReply.trim();
    if (!v) return;
    saveQuick([...quickReplies, v]);
    setNewReply("");
  }
  function removeQuickReply(i: number) {
    saveQuick(quickReplies.filter((_, idx) => idx !== i));
  }
  function useQuickReply(r: string) {
    setText((prev) => (prev.trim() ? `${prev} ${r}` : r));
    setQuickOpen(false);
  }

  async function loadMics() {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      const ins = devs.filter((d) => d.kind === "audioinput");
      setMics(ins.map((d, i) => ({ id: d.deviceId, label: d.label || `Microfone ${i + 1}` })));
    } catch {
      setMics([]);
    }
  }

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
        number: active.jid,
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
    await waSend(active.jid, t);
    setSending(false);
    reload();
  }

  // Envia um texto direto (usado pelos scripts).
  async function sendRaw(t: string) {
    if (!active || !t.trim() || sending) return;
    setSending(true);
    optimistic(t);
    await waSend(active.jid, t);
    setSending(false);
    reload();
  }

  function insertText(t: string) {
    setText((prev) => (prev.trim() ? `${prev}\n${t}` : t));
  }

  // Envia uma nota de voz (áudio de script) pelo número da conversa.
  async function sendAudioRaw(base64: string) {
    if (!active || !base64 || sending) return;
    setSending(true);
    optimistic("🎤 Áudio");
    await waSendMedia({ number: active.jid, kind: "audio", media: base64 });
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
      const audio =
        selectedMic && selectedMic !== "default"
          ? { deviceId: { exact: selectedMic } }
          : true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio });
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

  // Radar: separa quem precisa de ação pela última mensagem (quem falou + há quanto tempo).
  const radar = useMemo(() => {
    const now = Date.now();
    const hrs = (c: WaChat) => (c.time ? (now - new Date(c.time).getTime()) / 3.6e6 : 9999);
    const responder: WaChat[] = []; // cliente falou por último (bola com a gente)
    const followup: WaChat[] = []; // nós falamos, sem resposta 24-72h
    const recuperacao: WaChat[] = []; // sem resposta há 3+ dias
    for (const c of chats) {
      if (!c.fromMe) responder.push(c);
      else {
        const h = hrs(c);
        if (h >= 72) recuperacao.push(c);
        else if (h >= 24) followup.push(c);
      }
    }
    // Mais antigos (mais urgentes / mais frios) primeiro.
    const byOld = (a: WaChat, b: WaChat) => (a.time || "").localeCompare(b.time || "");
    responder.sort(byOld);
    followup.sort(byOld);
    recuperacao.sort(byOld);
    return { responder, followup, recuperacao, total: responder.length + followup.length + recuperacao.length };
  }, [chats]);

  const openChat = (c: WaChat) => {
    setActive(c);
    setView("chats");
    setScriptsOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-89px)] flex-col">
      {/* Barra de status */}
      <div className="flex items-center justify-between gap-2 border-b border-ink-700 px-4 py-2 sm:px-6">
        <span className="hidden items-center gap-2 text-xs font-bold text-emerald-300 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Conectado
        </span>

        {/* Alternância Conversas / Radar */}
        <div className="flex items-center gap-1 rounded-xl bg-ink-800 p-1">
          <button
            onClick={() => setView("chats")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              view === "chats" ? "bg-flame-500 text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Conversas
          </button>
          <button
            onClick={() => setView("radar")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              view === "radar" ? "bg-flame-500 text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Radar size={13} /> Radar
            {radar.total > 0 && (
              <span
                className={`rounded-full px-1.5 text-[10px] ${
                  view === "radar" ? "bg-black/20 text-black" : "bg-rose-500 text-white"
                }`}
              >
                {radar.total}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={disconnect}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-2.5 py-1.5 text-xs font-semibold text-rose-300 ring-1 ring-ink-700 hover:text-rose-200"
        >
          <Power size={14} /> <span className="hidden sm:inline">Desconectar</span>
        </button>
      </div>

      {view === "radar" ? (
        <RadarView radar={radar} onOpen={openChat} />
      ) : (
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
                          {chatLabel(c)}
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
        <section className={`${active ? "flex" : "hidden md:flex"} relative flex-1 flex-col bg-ink-950/40`}>
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
                    {chatLabel(active)}
                  </p>
                  {!active.jid.endsWith("@lid") && (
                    <p className="text-[11px] text-zinc-500">+{active.number}</p>
                  )}
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
              <div className="relative border-t border-ink-700 p-3">
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

                    {/* Seletor de microfone */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() => {
                          if (!micOpen) loadMics();
                          setMicOpen((o) => !o);
                          setQuickOpen(false);
                        }}
                        title="Escolher microfone"
                        className="flex h-10 w-8 items-center justify-center rounded-xl bg-ink-800 text-zinc-400 ring-1 ring-ink-700 hover:text-white"
                      >
                        <ChevronDown size={16} />
                      </button>
                      {micOpen && (
                        <div className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-xl border border-ink-700 bg-ink-850 p-1.5 shadow-2xl">
                          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                            Microfone
                          </p>
                          <MicRow
                            label="Padrão do sistema"
                            active={selectedMic === "default"}
                            onClick={() => {
                              setSelectedMic("default");
                              setMicOpen(false);
                            }}
                          />
                          {mics.map((m) => (
                            <MicRow
                              key={m.id || m.label}
                              label={m.label}
                              active={selectedMic === m.id}
                              onClick={() => {
                                setSelectedMic(m.id);
                                setMicOpen(false);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Respostas rápidas */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() => {
                          setQuickOpen((o) => !o);
                          setMicOpen(false);
                        }}
                        title="Respostas rápidas"
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-800 text-zinc-300 ring-1 ring-ink-700 hover:text-flame-400"
                      >
                        <Zap size={18} />
                      </button>
                      {quickOpen && (
                        <div className="absolute bottom-full left-0 z-20 mb-2 w-72 rounded-xl border border-ink-700 bg-ink-850 p-3 shadow-2xl">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-300">
                            Respostas rápidas
                          </p>
                          {quickReplies.length === 0 ? (
                            <p className="mb-3 text-xs text-zinc-500">
                              Nenhuma resposta salva. Crie modelos abaixo (ex.:
                              saudação, endereço, formas de pagamento).
                            </p>
                          ) : (
                            <ul className="mb-3 max-h-56 space-y-1 overflow-y-auto">
                              {quickReplies.map((r, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <button
                                    onClick={() => useQuickReply(r)}
                                    className="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-sm text-zinc-200 hover:bg-ink-800"
                                  >
                                    {r}
                                  </button>
                                  <button
                                    onClick={() => removeQuickReply(i)}
                                    className="rounded-lg p-1.5 text-zinc-500 hover:text-rose-400"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="flex items-center gap-2">
                            <input
                              value={newReply}
                              onChange={(e) => setNewReply(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && addQuickReply()}
                              placeholder="Nova resposta rápida…"
                              className="min-w-0 flex-1 rounded-lg border border-ink-700 bg-ink-950 px-2.5 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-flame-500"
                            />
                            <button
                              onClick={addQuickReply}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-flame-500 text-black hover:bg-flame-400"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setScriptsOpen(true);
                        setQuickOpen(false);
                        setMicOpen(false);
                      }}
                      title="Scripts"
                      className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-flame-500/15 px-3 text-sm font-bold text-flame-400 ring-1 ring-flame-500/40 hover:bg-flame-500/25"
                    >
                      <FileText size={16} /> Scripts
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

              <ScriptsDrawer
                open={scriptsOpen}
                onClose={() => setScriptsOpen(false)}
                contactName={chatLabel(active)}
                onInsert={insertText}
                onSend={sendRaw}
                onSendAudio={sendAudioRaw}
              />
            </>
          )}
        </section>
      </div>
      )}
    </div>
  );
}

function RadarView({
  radar,
  onOpen,
}: {
  radar: {
    responder: WaChat[];
    followup: WaChat[];
    recuperacao: WaChat[];
    total: number;
  };
  onOpen: (c: WaChat) => void;
}) {
  const groups = [
    {
      key: "responder",
      title: "Responder agora",
      hint: "O cliente falou e ninguém respondeu",
      dot: "bg-rose-500",
      list: radar.responder,
    },
    {
      key: "followup",
      title: "Follow-up",
      hint: "Você falou por último · sem resposta há 24h+",
      dot: "bg-gold-500",
      list: radar.followup,
    },
    {
      key: "recuperacao",
      title: "Recuperação",
      hint: "Esfriou · sem resposta há 3 dias+",
      dot: "bg-violet-500",
      list: radar.recuperacao,
    },
  ];

  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 sm:px-8">
      {radar.total === 0 && (
        <p className="py-10 text-center text-sm text-zinc-500">
          Tudo em dia! Ninguém esperando resposta. 🎉
        </p>
      )}
      {groups.map(
        (g) =>
          g.list.length > 0 && (
            <section key={g.key}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${g.dot}`} />
                <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-200">
                  {g.title}
                </h3>
                <span className="rounded-full bg-ink-800 px-2 text-[11px] font-bold text-zinc-400">
                  {g.list.length}
                </span>
                <span className="ml-1 text-[11px] text-zinc-500">· {g.hint}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {g.list.map((c) => (
                  <button
                    key={c.jid}
                    onClick={() => onOpen(c)}
                    className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900/80 px-4 py-3 text-left transition hover:border-flame-500/40"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-zinc-200">
                      {chatLabel(c).slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-white">
                          {chatLabel(c)}
                        </span>
                        <span className="shrink-0 text-[10px] text-zinc-500">
                          {chatTime(c.time)}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-zinc-500">
                        {c.fromMe ? "Você: " : ""}
                        {c.preview}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )
      )}
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

function MicRow({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-zinc-200 hover:bg-ink-800"
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {active && <Check size={14} className="text-emerald-400" />}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
