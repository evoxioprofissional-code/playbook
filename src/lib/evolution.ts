// Helper de servidor para falar com a Evolution API.
// A config vem dos headers (mandados pelo app) ou das variáveis de ambiente.
// Roda só no servidor (rotas /api/wa/*) — a API key nunca vai pro navegador.

export type EvoConfig = { url: string; key: string; instance: string };

export function configFromRequest(req: Request): EvoConfig | null {
  const h = req.headers;
  const url = (h.get("x-evo-url") || process.env.EVOLUTION_API_URL || "").trim();
  const key = (h.get("x-evo-key") || process.env.EVOLUTION_API_KEY || "").trim();
  const instance = (
    h.get("x-evo-instance") ||
    process.env.EVOLUTION_INSTANCE ||
    ""
  ).trim();
  if (!url || !key || !instance) return null;
  return { url: url.replace(/\/+$/, ""), key, instance };
}

export async function evo(
  cfg: EvoConfig,
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const res = await fetch(`${cfg.url}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.key,
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e: any) {
    return { ok: false, status: 0, data: { error: e?.message || "Sem conexão com o servidor Evolution" } };
  }
}

/** Número só com dígitos e código do país (assume Brasil 55 se faltar). */
export function normalizeNumber(n: string): string {
  const d = (n || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("55")) return d;
  return d.length <= 11 ? `55${d}` : d;
}
