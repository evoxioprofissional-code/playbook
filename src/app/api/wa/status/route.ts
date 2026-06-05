import { configFromRequest, evo } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// Estado da conexão: open (conectado), connecting, close, unconfigured.
export async function GET(req: Request) {
  const cfg = configFromRequest(req);
  if (!cfg) return Response.json({ state: "unconfigured" });

  const r = await evo(cfg, `/instance/connectionState/${cfg.instance}`, {
    method: "GET",
  });
  if (!r.ok) return Response.json({ state: r.status === 404 ? "close" : "error", detail: r.data });

  const state = r.data?.instance?.state || r.data?.state || "unknown";
  return Response.json({ state });
}
