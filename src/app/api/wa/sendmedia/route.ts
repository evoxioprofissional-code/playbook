import { configFromRequest, evo, resolveRecipient } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// Remove o prefixo data: do base64, se vier.
function rawBase64(s: string) {
  const i = (s || "").indexOf("base64,");
  return i >= 0 ? s.slice(i + 7) : s;
}

// Envia imagem/vídeo/documento (sendMedia) ou áudio como nota de voz (sendWhatsAppAudio).
export async function POST(req: Request) {
  const cfg = configFromRequest(req);
  if (!cfg) return Response.json({ error: "WhatsApp não configurado." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const number = resolveRecipient(body.number || "");
  const media = rawBase64(body.media || "");
  if (!number) return Response.json({ error: "Número vazio." }, { status: 400 });
  if (!media) return Response.json({ error: "Arquivo vazio." }, { status: 400 });

  let path: string;
  let payload: Record<string, unknown>;

  if (body.kind === "audio") {
    path = `/message/sendWhatsAppAudio/${cfg.instance}`;
    payload = { number, audio: media };
  } else {
    path = `/message/sendMedia/${cfg.instance}`;
    payload = {
      number,
      mediatype: body.mediatype || "image",
      mimetype: body.mimetype || "image/jpeg",
      media,
      fileName: body.fileName || "arquivo",
      caption: body.caption || "",
    };
  }

  const r = await evo(cfg, path, { method: "POST", body: JSON.stringify(payload) });
  if (!r.ok) {
    return Response.json(
      { error: "Falha ao enviar o arquivo. O WhatsApp está conectado?", detail: r.data },
      { status: r.status || 500 }
    );
  }
  return Response.json({ ok: true });
}
