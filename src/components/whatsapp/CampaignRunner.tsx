"use client";

import { useEffect, useRef, useState } from "react";
import { Send, X, Loader2 } from "lucide-react";
import {
  tickCampaign,
  fetchActiveCampaign,
  cancelCampaign,
  type CampaignState,
} from "@/lib/waCampaign";
import { isSupabaseEnabled } from "@/lib/supabase";

// Processa a campanha de recuperação em segundo plano e mostra o progresso.
// Fica montado no layout, então roda em qualquer página (enquanto o app estiver
// aberto). Várias abas podem rodar juntas — o envio é "claimado" sem duplicar.
export default function CampaignRunner() {
  const [state, setState] = useState<CampaignState | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (!isSupabaseEnabled) return;
    let alive = true;

    const run = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        await tickCampaign();
        const s = await fetchActiveCampaign();
        if (alive) setState(s);
      } catch {
        /* silencioso */
      } finally {
        busy.current = false;
      }
    };

    run();
    const id = setInterval(run, 60_000); // 1x por minuto
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!state) return null;

  const { sent, errors, total, pending, nextInMin } = state;

  async function cancel() {
    if (!state) return;
    if (!confirm("Parar a recuperação automática? As mensagens ainda não enviadas não saem.")) return;
    await cancelCampaign(state.campaign.id);
    setState(null);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-2xl border border-flame-500/40 bg-ink-900/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold text-white">
          <Send size={15} className="text-flame-400" /> Recuperação
        </span>
        <button onClick={cancel} title="Parar" className="rounded-lg p-1 text-zinc-500 hover:text-rose-400">
          <X size={16} />
        </button>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-flame-500 to-gold-500 transition-all"
          style={{ width: `${total ? Math.round((sent / total) * 100) : 0}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-zinc-300">
        <b className="text-white">{sent}</b> de {total} enviados
        {errors > 0 && <span className="text-rose-400"> · {errors} falhas</span>}
      </p>
      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-500">
        {pending > 0 ? (
          <>
            <Loader2 size={11} className="animate-spin text-flame-400" />
            {nextInMin && nextInMin > 0
              ? `Próximo em ~${nextInMin} min`
              : "Enviando o próximo…"}
          </>
        ) : (
          "Concluindo…"
        )}
      </p>
    </div>
  );
}
