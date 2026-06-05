"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Search, Power, ArrowLeft, MessageSquare } from "lucide-react";
import {
  waChats,
  waMessages,
  waSend,
  waLogout,
  type WaChat,
  type WaMessage,
} from "@/lib/wa";

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
  const endRef = useRef<HTMLDivElement>(null);

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

  async function send() {
    if (!active || !text.trim() || sending) return;
    const t = text.trim();
    setText("");
    setSending(true);
    setMessages((m) => [
      ...m,
      { id: `tmp-${Date.now()}`, fromMe: true, text: t, ts: Math.floor(Date.now() / 1000) },
    ]);
    await waSend(active.number, t);
    setSending(false);
    const r = await waMessages(active.jid);
    if (r.messages) setMessages(r.messages);
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
                        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                          m.fromMe
                            ? "rounded-br-sm bg-emerald-600/90 text-white"
                            : "rounded-bl-sm bg-ink-800 text-zinc-100"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <p
                          className={`mt-0.5 text-right text-[10px] ${
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
              <div className="flex items-end gap-2 border-t border-ink-700 p-3">
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
                  placeholder="Escreva uma mensagem…"
                  className="max-h-32 flex-1 resize-none rounded-xl border border-ink-700 bg-ink-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500"
                />
                <button
                  onClick={send}
                  disabled={!text.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-black transition hover:bg-emerald-400 disabled:opacity-40"
                >
                  <Send size={17} />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
