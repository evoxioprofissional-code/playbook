"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plug,
  QrCode,
  CheckCircle2,
  RefreshCw,
  Power,
  Send,
  Settings2,
  CircleAlert,
} from "lucide-react";
import {
  getWaConfig,
  setWaConfig,
  waStatus,
  waConnect,
  waSend,
  waLogout,
  type WaConfig,
} from "@/lib/wa";

type State = "loading" | "unconfigured" | "close" | "connecting" | "open" | "error";

export default function WhatsappConnect() {
  const [cfg, setCfg] = useState<WaConfig>({ url: "", key: "", instance: "j2a" });
  const [state, setState] = useState<State>("loading");
  const [qr, setQr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [testNumber, setTestNumber] = useState("");
  const [testMsg, setTestMsg] = useState("Olá! Aqui é a J2A Bonés 👋 Teste de conexão.");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);

  const configured = Boolean(cfg.url && cfg.key && cfg.instance);

  // Carrega config salva e checa status.
  useEffect(() => {
    const saved = getWaConfig();
    if (saved.url || saved.key || saved.instance) setCfg({ ...saved, instance: saved.instance || "j2a" });
    refreshStatus(saved.url ? saved : undefined);
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };

  async function refreshStatus(_c?: WaConfig) {
    const r = await waStatus();
    setState((r.state as State) || "error");
    if (r.state === "open") {
      setQr(null);
      stopPolling();
    }
  }

  function saveConfig() {
    setWaConfig(cfg);
    setMsg("Configuração salva.");
    setTimeout(() => setMsg(""), 1600);
    refreshStatus();
  }

  async function connect() {
    setWaConfig(cfg);
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
      // Renova o QR a cada ~24s (ele expira).
      if (tickRef.current % 8 === 0) {
        const c = await waConnect();
        if (c.base64) setQr(c.base64);
      }
    }, 3000);
  }

  async function disconnect() {
    await waLogout();
    stopPolling();
    setQr(null);
    setState("close");
  }

  async function sendTest() {
    setMsg("Enviando...");
    const r = await waSend(testNumber, testMsg);
    setMsg(r.ok ? "Mensagem enviada! ✅" : r.error || "Falha ao enviar.");
    setTimeout(() => setMsg(""), 2600);
  }

  return (
    <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:px-8 lg:grid-cols-2">
      {/* Configuração */}
      <section className="rounded-2xl border border-ink-700 bg-ink-900/80 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-300">
          <Settings2 size={16} className="text-flame-400" /> Servidor Evolution
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Cole os dados do seu servidor Evolution. Ficam salvos neste navegador.
        </p>

        <div className="mt-4 space-y-3">
          <Field label="URL do servidor">
            <input
              value={cfg.url}
              onChange={(e) => setCfg({ ...cfg, url: e.target.value })}
              placeholder="https://seu-evolution.com"
              className="inp"
            />
          </Field>
          <Field label="API Key (global)">
            <input
              value={cfg.key}
              onChange={(e) => setCfg({ ...cfg, key: e.target.value })}
              placeholder="sua-api-key"
              type="password"
              className="inp"
            />
          </Field>
          <Field label="Nome da instância">
            <input
              value={cfg.instance}
              onChange={(e) => setCfg({ ...cfg, instance: e.target.value })}
              placeholder="j2a"
              className="inp"
            />
          </Field>
        </div>

        <button
          onClick={saveConfig}
          className="mt-4 w-full rounded-xl bg-ink-800 py-2.5 text-sm font-bold text-zinc-200 ring-1 ring-ink-700 hover:text-white"
        >
          Salvar configuração
        </button>

        <style jsx>{`
          :global(.inp) {
            width: 100%;
            border-radius: 0.6rem;
            border: 1px solid #26262c;
            background: #0a0a0b;
            padding: 0.55rem 0.75rem;
            font-size: 0.875rem;
            color: #f4f4f5;
            outline: none;
          }
          :global(.inp:focus) {
            border-color: #ff6b1a;
          }
        `}</style>
      </section>

      {/* Conexão */}
      <section className="rounded-2xl border border-ink-700 bg-ink-900/80 p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-300">
            <Plug size={16} className="text-flame-400" /> Conexão
          </h2>
          <StatusBadge state={state} />
        </div>

        {!configured ? (
          <p className="mt-6 text-sm text-zinc-500">
            Preencha o servidor ao lado pra liberar a conexão.
          </p>
        ) : state === "open" ? (
          <div className="mt-6 flex flex-col items-center text-center">
            <CheckCircle2 size={44} className="text-emerald-400" />
            <p className="mt-2 text-base font-bold text-white">WhatsApp conectado</p>
            <p className="text-xs text-zinc-500">
              Os scripts já podem ser enviados direto pelo número conectado.
            </p>
            <button
              onClick={disconnect}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-ink-800 px-3 py-2 text-sm font-semibold text-rose-300 ring-1 ring-ink-700 hover:text-rose-200"
            >
              <Power size={15} /> Desconectar
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center">
            {qr ? (
              <>
                <div className="rounded-xl bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="QR Code do WhatsApp" className="h-52 w-52" />
                </div>
                <p className="mt-3 max-w-xs text-center text-xs text-zinc-400">
                  Abra o WhatsApp no celular → <b>Aparelhos conectados</b> →{" "}
                  <b>Conectar um aparelho</b> e aponte pra este QR.
                </p>
                <button
                  onClick={connect}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-flame-400 hover:text-flame-300"
                >
                  <RefreshCw size={13} /> Gerar novo QR
                </button>
              </>
            ) : (
              <button
                onClick={connect}
                className="mt-4 flex items-center gap-2 rounded-xl bg-flame-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-flame-400"
              >
                <QrCode size={16} /> Gerar QR e conectar
              </button>
            )}
          </div>
        )}

        {msg && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-zinc-300">
            <CircleAlert size={13} className="text-flame-400" /> {msg}
          </p>
        )}
      </section>

      {/* Teste de envio */}
      {state === "open" && (
        <section className="rounded-2xl border border-ink-700 bg-ink-900/80 p-5 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-300">
            <Send size={16} className="text-emerald-400" /> Teste de envio
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end">
            <Field label="Número (com DDD)">
              <input
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="84999999999"
                className="inp2"
              />
            </Field>
            <Field label="Mensagem">
              <input
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
                className="inp2"
              />
            </Field>
            <button
              onClick={sendTest}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-emerald-400"
            >
              <Send size={15} /> Enviar teste
            </button>
          </div>
          <style jsx>{`
            :global(.inp2) {
              width: 100%;
              border-radius: 0.6rem;
              border: 1px solid #26262c;
              background: #0a0a0b;
              padding: 0.55rem 0.75rem;
              font-size: 0.875rem;
              color: #f4f4f5;
              outline: none;
            }
            :global(.inp2:focus) {
              border-color: #22c55e;
            }
          `}</style>
        </section>
      )}
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
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}
