"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode, RefreshCw, Smartphone, CircleAlert } from "lucide-react";
import { waStatus, waConnect } from "@/lib/wa";

type State = "loading" | "unconfigured" | "close" | "connecting" | "open" | "error";

export default function WhatsappConnect() {
  const [state, setState] = useState<State>("loading");
  const [qr, setQr] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    refreshStatus();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };

  async function refreshStatus() {
    const r = await waStatus();
    setState((r.state as State) || "error");
    if (r.state === "open") {
      setQr(null);
      stopPolling();
    }
  }

  async function connect() {
    setMsg("");
    setState("connecting");
    const r = await waConnect();
    if (r.error) {
      setState("error");
      setMsg(r.error);
      return;
    }
    if (r.base64) setQr(r.base64);
    startPolling();
  }

  function startPolling() {
    stopPolling();
    tickRef.current = 0;
    pollRef.current = setInterval(async () => {
      tickRef.current += 1;
      const r = await waStatus();
      if (r.state === "open") {
        setState("open");
        setQr(null);
        stopPolling();
        return;
      }
      setState((r.state as State) || "connecting");
      if (tickRef.current % 8 === 0) {
        const c = await waConnect();
        if (c.base64) setQr(c.base64);
      }
    }, 3000);
  }

  return (
    <div className="flex justify-center px-6 py-10 sm:px-8">
      <div className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900/80 p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-300">
            <Smartphone size={16} className="text-flame-400" /> Conectar WhatsApp
          </h2>
          <StatusBadge state={state} />
        </div>

        {state === "unconfigured" ? (
          <p className="mt-6 text-sm text-zinc-400">
            O WhatsApp ainda não está configurado no servidor. Avise o responsável
            técnico pra concluir a configuração.
          </p>
        ) : (
          <div className="mt-6 flex flex-col items-center">
            {qr ? (
              <>
                <div className="rounded-xl bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="QR Code do WhatsApp" className="h-56 w-56" />
                </div>
                <p className="mt-3 max-w-xs text-center text-xs text-zinc-400">
                  Abra o WhatsApp no celular → <b>Aparelhos conectados</b> →{" "}
                  <b>Conectar um aparelho</b> e aponte para este QR.
                </p>
                <button
                  onClick={connect}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-flame-400 hover:text-flame-300"
                >
                  <RefreshCw size={13} /> Gerar novo QR
                </button>
              </>
            ) : (
              <>
                <p className="mb-4 text-center text-sm text-zinc-400">
                  Gere o QR e conecte o número comercial pra enviar e receber
                  mensagens aqui dentro.
                </p>
                <button
                  onClick={connect}
                  className="flex items-center gap-2 rounded-xl bg-flame-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-flame-400"
                >
                  <QrCode size={16} /> Gerar QR e conectar
                </button>
              </>
            )}
          </div>
        )}

        {msg && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-rose-300">
            <CircleAlert size={13} /> {msg}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state: State }) {
  const map: Record<State, { label: string; cls: string }> = {
    loading: { label: "Carregando", cls: "bg-ink-800 text-zinc-400" },
    unconfigured: { label: "Não configurado", cls: "bg-ink-800 text-zinc-400" },
    close: { label: "Desconectado", cls: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30" },
    connecting: { label: "Aguardando QR", cls: "bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/30" },
    open: { label: "Conectado", cls: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30" },
    error: { label: "Erro", cls: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30" },
  };
  const s = map[state];
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>;
}
