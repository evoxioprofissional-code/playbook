"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  UserRound,
  Lock,
  TriangleAlert,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useSession } from "@/components/team/session";
import {
  fetchEmployees,
  saveEmployee,
  deleteEmployee,
  isSupabaseEnabled,
  AREAS,
  type Employee,
  type Role,
  type Area,
} from "@/lib/store";

type Draft = {
  id?: string;
  name: string;
  pin: string;
  role: Role;
  areas: Area[];
};

const EMPTY: Draft = { name: "", pin: "", role: "vendedor", areas: [] };

export default function AdminPanel() {
  const { user } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setEmployees(await fetchEmployees());
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  // Acesso só pro gestor.
  if (!user || user.role !== "gestor") {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <Lock size={36} className="text-zinc-600" />
        <h2 className="mt-3 text-lg font-extrabold text-white">Área restrita</h2>
        <p className="mt-1 max-w-sm text-sm text-zinc-400">
          O painel de administração é só para o <b>Gestor</b>. Entre com o PIN do
          gestor (canto inferior esquerdo) para acessar.
        </p>
      </div>
    );
  }

  async function submit() {
    if (!draft || !draft.name.trim() || draft.pin.trim().length < 4) return;
    setSaving(true);
    setErr("");
    const r = await saveEmployee(draft);
    setSaving(false);
    if (!r.ok) {
      setErr(r.error || "Falha ao salvar.");
      return;
    }
    setDraft(null);
    load();
  }

  async function remove(id: string) {
    await deleteEmployee(id);
    setDraft(null);
    load();
  }

  return (
    <div className="px-6 py-6 sm:px-8">
      {!isSupabaseEnabled && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3">
          <TriangleAlert size={18} className="shrink-0 text-gold-400" />
          <p className="text-sm text-zinc-200">
            Supabase não conectado — o cadastro de funcionários precisa do Supabase.
          </p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          Cadastre a equipe, defina o PIN e a <b className="text-white">função</b> de
          cada um (o que aparece no Dashboard dele).
        </p>
        <button
          onClick={() => setDraft({ ...EMPTY })}
          disabled={!isSupabaseEnabled}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-flame-500 px-3.5 py-2 text-sm font-bold text-black hover:bg-flame-400 disabled:opacity-40"
        >
          <Plus size={16} strokeWidth={2.6} /> Novo funcionário
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-700">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Carregando…</p>
        ) : employees.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            Nenhum funcionário. Clique em “Novo funcionário”.
          </p>
        ) : (
          <ul className="divide-y divide-ink-700">
            {employees.map((e) => (
              <li key={e.id} className="flex items-center gap-3 bg-ink-900/60 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-flame-400">
                  {e.role === "gestor" ? <ShieldCheck size={18} /> : <UserRound size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-bold text-white">
                    {e.name}
                    <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                      {e.role}
                    </span>
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-zinc-500">
                    PIN <span className="font-mono text-zinc-300">{e.pin}</span> ·{" "}
                    {e.role === "gestor" ? (
                      "vê tudo"
                    ) : e.areas && e.areas.length ? (
                      e.areas.map((a) => (
                        <span
                          key={a}
                          className="rounded bg-flame-500/15 px-1.5 py-0.5 font-bold text-flame-400"
                        >
                          {AREAS.find((x) => x.key === a)?.label || a}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-400">vê todas as áreas</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setDraft({
                      id: e.id,
                      name: e.name,
                      pin: e.pin,
                      role: e.role,
                      areas: e.areas || [],
                    })
                  }
                  className="rounded-lg p-2 text-zinc-400 hover:text-flame-400"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Form */}
      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Editar funcionário" : "Novo funcionário"}
        subtitle="A função define o que ele vê no Dashboard."
        footer={
          draft ? (
            <div className="flex items-center gap-2">
              {draft.id && (
                <button
                  onClick={() => remove(draft.id!)}
                  className="flex items-center gap-1.5 rounded-xl bg-ink-800 px-3 py-2.5 text-sm font-bold text-rose-300 ring-1 ring-ink-700 hover:text-rose-200"
                >
                  <Trash2 size={15} /> Excluir
                </button>
              )}
              <button
                onClick={submit}
                disabled={!draft.name.trim() || draft.pin.trim().length < 4 || saving}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
                  draft.name.trim() && draft.pin.trim().length >= 4 && !saving
                    ? "bg-flame-500 text-black hover:bg-flame-400"
                    : "cursor-not-allowed bg-ink-700 text-zinc-500"
                }`}
              >
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          ) : null
        }
      >
        {draft && (
          <div className="space-y-3">
            <Field label="Nome">
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Ex.: Romário"
                className="ad-inp"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="PIN (4 dígitos)">
                <input
                  value={draft.pin}
                  onChange={(e) =>
                    setDraft({ ...draft, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })
                  }
                  placeholder="0000"
                  inputMode="numeric"
                  className="ad-inp font-mono"
                />
              </Field>
              <Field label="Papel">
                <select
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}
                  className="ad-inp"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="gestor">Gestor</option>
                </select>
              </Field>
            </div>

            <div>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Função (áreas do Dashboard)
              </span>
              {draft.role === "gestor" ? (
                <p className="rounded-lg bg-ink-800 px-3 py-2 text-xs text-zinc-400">
                  O gestor vê todas as áreas e o painel da equipe.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {AREAS.map((a) => {
                      const on = draft.areas.includes(a.key);
                      return (
                        <button
                          key={a.key}
                          onClick={() =>
                            setDraft({
                              ...draft,
                              areas: on
                                ? draft.areas.filter((x) => x !== a.key)
                                : [...draft.areas, a.key],
                            })
                          }
                          className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                            on
                              ? "bg-flame-500 text-black"
                              : "bg-ink-800 text-zinc-300 ring-1 ring-ink-700 hover:text-white"
                          }`}
                        >
                          {a.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[11px] text-zinc-500">
                    {draft.areas.length === 0
                      ? "Nenhuma marcada = vê todas as áreas."
                      : `Vê só: ${draft.areas
                          .map((a) => AREAS.find((x) => x.key === a)?.label)
                          .join(", ")}.`}
                  </p>
                </>
              )}
            </div>

            {err && <p className="text-xs font-semibold text-rose-400">{err}</p>}
          </div>
        )}

        <style jsx>{`
          :global(.ad-inp) {
            width: 100%;
            border-radius: 0.6rem;
            border: 1px solid #26262c;
            background: #0a0a0b;
            padding: 0.55rem 0.75rem;
            font-size: 0.875rem;
            color: #f4f4f5;
            outline: none;
          }
          :global(.ad-inp:focus) {
            border-color: #ff6b1a;
          }
        `}</style>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}
