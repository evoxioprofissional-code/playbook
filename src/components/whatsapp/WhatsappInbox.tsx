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
  Pencil,
  History,
  Ban,
} from "lucide-react";
import ScriptsDrawer from "./ScriptsDrawer";
import {
  waChats,
  waMessages,
  waSend,
  waSendMedia,
  waMedia,
  waLogout,
  waFullSync,
  type WaChat,
  type WaMessage,
} from "@/lib/wa";
import { fetchAliases, setAlias } from "@/lib/waAliases";
import { syncWhatsappLeads } from "@/lib/kanban";
import {
  createCampaign,
  fetchActiveCampaign,
  cancelCampaign,
  fetchRecoveredJids,
  type CampaignState,
} from "@/lib/waCampaign";
import { useScripts } from "@/components/scripts/useScripts";
import { fillBody, loadFieldValues } from "@/lib/scriptsStore";
import { useSession } from "@/components/team/session";
import Modal from "@/components/ui/Modal";

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

function chatLabel(
  c: { name: string | null; number: string; jid: string },
  aliases?: Record<string, string>
) {
  if (aliases && aliases[c.jid]) return aliases[c.jid];
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
  const { user } = useSession();
  const { scripts } = useScripts();
  const [recoverTargets, setRecoverTargets] = useState<WaChat[] | null>(null);
  const [campaign, setCampaign] = useState<CampaignState | null>(null);
  const [recovered, setRecovered] = useState<Record<string, string>>({});
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
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelRef = useRef(false);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aliasesRef = useRef<Record<string, string>>({});
  const lastLeadSyncRef = useRef(0);

  // Lista de conversas + atualização automática.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const r = await waChats();
      if (alive && r.chats) {
        setChats(r.chats);
        setLoadingChats(false);
        // Toda conversa nova vira lead no CRM (no máx. 1x a cada 30s).
        if (Date.now() - lastLeadSyncRef.current > 30000) {
          lastLeadSyncRef.current = Date.now();
          syncWhatsappLeads(r.chats, aliasesRef.current).catch(() => {});
        }
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

  // Carrega os apelidos das conversas (nomes que a equipe deu).
  useEffect(() => {
    fetchAliases().then((a) => {
      setAliases(a);
      aliasesRef.current = a;
    });
  }, []);

  // Mantém o ref sincronizado pra sincronização de leads usar o nome certo.
  useEffect(() => {
    aliasesRef.current = aliases;
  }, [aliases]);

  // Acompanha a campanha de recuperação em andamento (pra mostrar/parar)
  // e quem já recebeu recuperação (etiqueta no contato).
  useEffect(() => {
    let alive = true;
    const load = () => {
      fetchActiveCampaign().then((s) => alive && setCampaign(s));
      fetchRecoveredJids().then((m) => alive && setRecovered(m));
    };
    load();
    const id = setInterval(load, 15000);
    const wake = () => load();
    window.addEventListener("j2a-campaign-started", wake);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("j2a-campaign-started", wake);
    };
  }, []);

  async function stopCampaign() {
    if (!campaign) return;
    if (!confirm("Parar a recuperação? As mensagens ainda não enviadas não vão sair.")) return;
    await cancelCampaign(campaign.campaign.id);
    setCampaign(null);
  }

  const label = (c: { name: string | null; number: string; jid: string }) =>
    chatLabel(c, aliases);

  // Salva/limpa o apelido da conversa aberta.
  async function saveRename() {
    if (!active) return;
    const v = renameVal.trim();
    setAliases((m) => {
      const next = { ...m };
      if (v) next[active.jid] = v;
      else delete next[active.jid];
      return next;
    });
    setRenaming(false);
    await setAlias(active.jid, v);
  }

  function startRename() {
    if (!active) return;
    setRenameVal(aliases[active.jid] || active.name || "");
    setRenaming(true);
  }

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

  async function fullSync() {
    if (
      !confirm(
        "Para puxar TODAS as conversas, o WhatsApp precisa ser reconectado (vai pedir o QR de novo). Suas conversas atuais continuam salvas. Continuar?"
      )
    )
      return;
    await waFullSync();
    onDisconnect();
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return chats;
    const digits = s.replace(/\D/g, "");
    return chats.filter(
      (c) =>
        (aliases[c.jid] || "").toLowerCase().includes(s) ||
        (c.name || "").toLowerCase().includes(s) ||
        (digits && c.number.includes(digits))
    );
  }, [chats, q, aliases]);

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

  // Conversa sem nome real (nem apelido) → mostra dica pra identificar.
  const unnamed = active ? !aliases[active.jid] && !active.name : false;

  // 1ª mensagem que o cliente mandou (ajuda a identificar quem é).
  const firstInbound = useMemo(() => {
    const m = messages.find((x) => !x.fromMe && x.kind === "text" && x.text.trim());
    return m?.text.trim() || "";
  }, [messages]);

  const openChat = (c: WaChat) => {
    setActive(c);
    setView("chats");
    setScriptsOpen(true);
  };

  // Sugestão inicial da mensagem de recuperação ({cliente} é trocado por contato).
  const recoverScripts = scripts.filter((s) => s.category === "recuperacao" && !s.audio);
  const fillForCampaign = (body: string) =>
    fillBody(body, { ...loadFieldValues(), vendedor: user?.name || "", cliente: "{cliente}" });

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

        <div className="flex items-center gap-2">
          {campaign && (
            <button
              onClick={stopCampaign}
              title="Parar a recuperação automática"
              className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-2.5 py-1.5 text-xs font-bold text-rose-300 ring-1 ring-rose-500/40 hover:bg-rose-500/30"
            >
              <Ban size={14} />
              <span className="hidden sm:inline">Parar recuperação</span>
              <span className="rounded-full bg-rose-500/30 px-1.5 text-[10px]">
                {campaign.sent}/{campaign.total}
              </span>
            </button>
          )}
          <button
            onClick={fullSync}
            title="Puxar todas as conversas (reconecta o WhatsApp)"
            className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 ring-1 ring-ink-700 hover:text-flame-400"
          >
            <History size={14} /> <span className="hidden sm:inline">Histórico completo</span>
          </button>
          <button
            onClick={disconnect}
            className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-2.5 py-1.5 text-xs font-semibold text-rose-300 ring-1 ring-ink-700 hover:text-rose-200"
          >
            <Power size={14} /> <span className="hidden sm:inline">Desconectar</span>
          </button>
        </div>
      </div>

      {view === "radar" ? (
        <RadarView
          radar={radar}
          onOpen={openChat}
          aliases={aliases}
          onRecover={(list) => setRecoverTargets(list)}
          campaign={campaign}
          onStop={stopCampaign}
          recovered={recovered}
        />
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
                      {initials(label(c), c.number)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-sm font-bold text-white">
                            {label(c)}
                          </span>
                          {recovered[c.jid] && <RecoveredTag compact />}
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
                  {initials(label(active), active.number)}
                </span>
                {renaming ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      autoFocus
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename();
                        if (e.key === "Escape") setRenaming(false);
                      }}
                      placeholder="Nome do contato…"
                      className="min-w-0 flex-1 rounded-lg border border-ink-700 bg-ink-950 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-flame-500"
                    />
                    <button
                      onClick={saveRename}
                      title="Salvar nome"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-flame-500 text-black hover:bg-flame-400"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setRenaming(false)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-zinc-400 ring-1 ring-ink-700 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="leading-tight">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{label(active)}</p>
                        {recovered[active.jid] && <RecoveredTag at={recovered[active.jid]} />}
                      </div>
                      {!active.jid.endsWith("@lid") && (
                        <p className="text-[11px] text-zinc-500">+{active.number}</p>
                      )}
                    </div>
                    <button
                      onClick={startRename}
                      title="Dar um nome a este contato"
                      className="ml-1 flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-zinc-500 hover:bg-ink-800 hover:text-flame-400"
                    >
                      <Pencil size={13} /> {aliases[active.jid] ? "Renomear" : "Dar nome"}
                    </button>
                  </>
                )}
              </div>

              {/* Mensagens */}
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
                {unnamed && !renaming && (
                  <div className="mb-3 rounded-xl border border-gold-500/25 bg-gold-500/10 px-3 py-2.5 text-xs text-zinc-300">
                    <p className="font-bold text-gold-300">Contato sem nome (privacidade do WhatsApp)</p>
                    {firstInbound ? (
                      <p className="mt-1">
                        1ª mensagem do cliente: <span className="text-zinc-100">“{firstInbound.slice(0, 120)}”</span>
                      </p>
                    ) : (
                      <p className="mt-1">O WhatsApp não informou o nome deste contato.</p>
                    )}
                    <button
                      onClick={startRename}
                      className="mt-1.5 inline-flex items-center gap-1 font-semibold text-flame-400 hover:text-flame-300"
                    >
                      <Pencil size={12} /> Dar um nome a este contato
                    </button>
                  </div>
                )}
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
                contactName={label(active)}
                onInsert={insertText}
                onSend={sendRaw}
                onSendAudio={sendAudioRaw}
              />
            </>
          )}
        </section>
      </div>
      )}

      {recoverTargets && (
        <RecoverModal
          targets={recoverTargets}
          nameOf={(c) => label(c)}
          scripts={recoverScripts}
          fillForCampaign={fillForCampaign}
          onClose={() => setRecoverTargets(null)}
          onStop={stopCampaign}
        />
      )}
    </div>
  );
}

function RadarView({
  radar,
  onOpen,
  aliases,
  onRecover,
  campaign,
  onStop,
  recovered,
}: {
  radar: {
    responder: WaChat[];
    followup: WaChat[];
    recuperacao: WaChat[];
    total: number;
  };
  onOpen: (c: WaChat) => void;
  aliases: Record<string, string>;
  onRecover: (list: WaChat[]) => void;
  campaign: CampaignState | null;
  onStop: () => void;
  recovered: Record<string, string>;
}) {
  const label = (c: WaChat) => chatLabel(c, aliases);
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
                {g.key === "recuperacao" &&
                  g.list.length > 0 &&
                  (campaign ? (
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">
                        Enviando {campaign.sent}/{campaign.total}…
                      </span>
                      <button
                        onClick={onStop}
                        className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-300 ring-1 ring-rose-500/40 hover:bg-rose-500/30"
                      >
                        <Ban size={13} /> Parar recuperação
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onRecover(g.list)}
                      className="ml-auto flex items-center gap-1.5 rounded-lg bg-flame-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-flame-400"
                    >
                      <Send size={13} /> Recuperar todos ({g.list.length})
                    </button>
                  ))}
              </div>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {g.list.map((c) => (
                  <button
                    key={c.jid}
                    onClick={() => onOpen(c)}
                    className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900/80 px-4 py-3 text-left transition hover:border-flame-500/40"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-zinc-200">
                      {label(c).slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-sm font-bold text-white">
                            {label(c)}
                          </span>
                          {recovered[c.jid] && <RecoveredTag compact />}
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

// Etiqueta "recuperação feita" no contato.
function RecoveredTag({ at, compact }: { at?: string; compact?: boolean }) {
  const date = at
    ? new Date(at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : "";
  if (compact) {
    return (
      <span
        title={`Recuperação feita${date ? ` em ${date}` : ""}`}
        className="flex shrink-0 items-center gap-0.5 rounded bg-violet-500/20 px-1 py-0.5 text-[9px] font-bold text-violet-300"
      >
        <Check size={9} strokeWidth={3} /> rec.
      </span>
    );
  }
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">
      <Check size={11} strokeWidth={3} /> Recuperação feita{date ? ` · ${date}` : ""}
    </span>
  );
}

// Formata uma duração em segundos: "45s", "8 min", "1h20".
function fmtDur(totalSec: number) {
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.round(totalSec / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;
}

function RecoverModal({
  targets,
  nameOf,
  scripts,
  fillForCampaign,
  onClose,
  onStop,
}: {
  targets: WaChat[];
  nameOf: (c: WaChat) => string;
  scripts: { id: string; title: string; body: string }[];
  fillForCampaign: (body: string) => string;
  onClose: () => void;
  onStop: () => void;
}) {
  const [message, setMessage] = useState("");
  const [intervalVal, setIntervalVal] = useState(8);
  const [unit, setUnit] = useState<"min" | "seg">("min");
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");
  const [running, setRunning] = useState<boolean | null>(null);

  useEffect(() => {
    fetchActiveCampaign().then((s) => setRunning(Boolean(s)));
  }, []);

  const n = targets.length;
  const intervalSec = unit === "min" ? intervalVal * 60 : intervalVal;
  const everyLabel = unit === "min" ? `${intervalVal} min` : `${intervalVal}s`;
  const durLabel = fmtDur(Math.max(0, (n - 1) * intervalSec));

  async function launch() {
    if (!message.trim() || launching) return;
    setLaunching(true);
    setError("");
    const r = await createCampaign({
      message: message.trim(),
      intervalSec,
      targets: targets.map((c) => ({ jid: c.jid, name: nameOf(c) })),
    });
    setLaunching(false);
    if (r.ok) {
      onClose();
      alert(
        `Recuperação iniciada! ${n} contatos — 1 mensagem a cada ${everyLabel}. Pode fechar essa tela; o envio continua enquanto o app estiver aberto.`
      );
    } else {
      setError(r.error || "Falha ao iniciar.");
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Recuperação automática"
      subtitle={`Enviar pra ${n} ${n === 1 ? "contato" : "contatos"} em recuperação, com intervalo de segurança.`}
      footer={
        running ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onStop();
                onClose();
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-500/20 py-2.5 text-sm font-bold text-rose-300 ring-1 ring-rose-500/40 hover:bg-rose-500/30"
            >
              <Ban size={15} /> Parar recuperação
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-ink-700 px-4 py-2.5 text-sm font-bold text-zinc-300"
            >
              Fechar
            </button>
          </div>
        ) : (
          <button
            onClick={launch}
            disabled={!message.trim() || launching}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
              message.trim() && !launching
                ? "bg-flame-500 text-black hover:bg-flame-400"
                : "cursor-not-allowed bg-ink-700 text-zinc-500"
            }`}
          >
            <Send size={16} /> {launching ? "Iniciando…" : `Disparar para ${n}`}
          </button>
        )
      }
    >
      {running ? (
        <p className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm text-zinc-200">
          Já existe uma recuperação <b className="text-white">em andamento</b>. Espere
          terminar ou pare pelo card no canto da tela antes de iniciar outra.
        </p>
      ) : (
        <div className="space-y-3">
          {scripts.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Usar um script de recuperação
              </p>
              <div className="flex flex-wrap gap-2">
                {scripts.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setMessage(fillForCampaign(s.body))}
                    className="rounded-lg bg-ink-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 ring-1 ring-ink-700 hover:text-flame-400"
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Mensagem
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Ex.: Oi {cliente}! Passando pra avisar que abrimos um lote novo de bonés essa semana…"
              className="w-full resize-none rounded-xl border border-ink-700 bg-ink-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-flame-500"
            />
            <span className="mt-1 block text-[11px] text-zinc-500">
              <b className="text-zinc-300">{"{cliente}"}</b> é trocado automaticamente
              pelo nome de cada contato.
            </span>
          </label>

          <div>
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Tempo entre cada envio
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={intervalVal}
                onChange={(e) => setIntervalVal(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 rounded-lg border border-ink-700 bg-ink-950 px-2 py-2 text-center text-sm text-white outline-none focus:border-flame-500"
              />
              <div className="flex items-center gap-1 rounded-lg bg-ink-800 p-1">
                {(["min", "seg"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                      unit === u ? "bg-flame-500 text-black" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {u === "min" ? "minutos" : "segundos"}
                  </button>
                ))}
              </div>
            </div>
            {unit === "seg" && (
              <p className="mt-1 text-[11px] text-gold-400">
                Segundos é ideal só pra testar com poucos contatos. Pra valer, use minutos
                (8+) pra não arriscar o número.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-ink-700 bg-ink-900/60 px-4 py-3 text-sm text-zinc-300">
            <p>
              <b className="text-white">{n}</b> mensagens · 1 a cada{" "}
              <b className="text-white">{everyLabel}</b> · termina em ~
              <b className="text-white">{durLabel}</b>.
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              O envio espaçado protege o número de bloqueio. Continua enquanto o app
              estiver aberto (pode trocar de aba).
            </p>
          </div>

          {error && <p className="text-xs font-semibold text-rose-400">{error}</p>}
        </div>
      )}
    </Modal>
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
