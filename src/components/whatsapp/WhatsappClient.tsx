"use client";

import { useEffect, useState } from "react";
import { waStatus } from "@/lib/wa";
import WhatsappConnect from "./WhatsappConnect";
import WhatsappInbox from "./WhatsappInbox";

// Mostra a Inbox quando conectado; senão, a tela de conexão (QR).
export default function WhatsappClient() {
  const [state, setState] = useState<string>("loading");

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const r = await waStatus();
      if (alive) setState(r.state);
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (state === "open") {
    return <WhatsappInbox onDisconnect={() => setState("close")} />;
  }
  return <WhatsappConnect />;
}
