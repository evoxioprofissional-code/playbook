"use client";

import { useEffect, useState } from "react";
import { Plus, Building2, UserRound, TriangleAlert } from "lucide-react";
import Modal from "@/components/ui/Modal";
import {
  fetchOrganizations,
  createOrganization,
  fetchEmployees,
  saveEmployee,
  isSupabaseEnabled,
  type Organization,
  type Employee,
} from "@/lib/store";

type Draft = {
  factory: string;
  managerName: string;
  email: string;
  password: string;
};

const EMPTY: Draft = { factory: "", managerName: "", email: "", password: "" };

export default function MasterPanel() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    const [o, e] = await Promise.all([fetchOrganizations(), fetchEmployees()]);
    setOrgs(o);
    setEmployees(e);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  async function submit() {
    if (!draft) return;
    if (!draft.factory.trim() || !draft.managerName.trim() || !draft.email.trim()) {
      setErr("Preencha o nome da fábrica, do gestor e o e-mail.");
      return;
    }
    if (draft.password.length < 6) {
      setErr("Defina uma senha de pelo menos 6 caracteres.");
      return;
    }
    setSaving(true);
    setErr("");
    const org = await createOrganization(draft.factory);
    if (!org.ok || !org.id) {
      setSaving(false);
      setErr(org.error || "Falha ao criar a fábrica.");
      return;
    }
    const r = await saveEmployee(
      { name: draft.managerName, email: draft.email, role: "gestor", orgId: org.id },
      draft.password
    );
    setSaving(false);
    if (!r.ok) {
      setErr(r.error || "Fábrica criada, mas falhou ao criar o gestor.");
      load();
      return;
    }
    setDraft(null);
    load();
  }

  const countBy = (orgId: string) => employees.filter((e) => e.orgId === orgId);
  const managerOf = (orgId: string) =>
    employees.find((e) => e.orgId === orgId && e.role === "gestor");

  return (
    <div className="px-6 py-6 sm:px-8">
      {!isSupabaseEnabled && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3">
          <TriangleAlert size={18} className="shrink-0 text-gold-400" />
          <p className="text-sm text-zinc-200">
            Supabase não conectado — o cadastro de fábricas precisa do Supabase.
          </p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          Cada <b className="text-white">fábrica</b> tem seu gestor e seus vendedores,
          com WhatsApp, leads e equipe separados das outras.
        </p>
        <button
          onClick={() => {
            setErr("");
            setDraft({ ...EMPTY });
          }}
          disabled={!isSupabaseEnabled}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-flame-500 px-3.5 py-2 text-sm font-bold text-black hover:bg-flame-400 disabled:opacity-40"
        >
          <Plus size={16} strokeWidth={2.6} /> Nova fábrica
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-700">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Carregando…</p>
        ) : orgs.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            Nenhuma fábrica ainda. Clique em “Nova fábrica”.
          </p>
        ) : (
          <ul className="divide-y divide-ink-700">
            {orgs.map((o) => {
              const mgr = managerOf(o.id);
              const total = countBy(o.id).length;
              return (
                <li key={o.id} className="flex items-center gap-3 bg-ink-900/60 px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-flame-400">
                    <Building2 size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">{o.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <UserRound size={11} />
                      {mgr ? `Gestor: ${mgr.name} · ${mgr.email}` : "Sem gestor"} ·{" "}
                      {total} {total === 1 ? "pessoa" : "pessoas"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title="Nova fábrica"
        subtitle="Cria a fábrica e já cadastra o gestor dela (login de acesso)."
        footer={
          draft ? (
            <button
              onClick={submit}
              disabled={saving}
              className={`w-full rounded-xl py-2.5 text-sm font-bold transition ${
                !saving ? "bg-flame-500 text-black hover:bg-flame-400" : "bg-ink-700 text-zinc-500"
              }`}
            >
              {saving ? "Criando…" : "Criar fábrica + gestor"}
            </button>
          ) : null
        }
      >
        {draft && (
          <div className="space-y-3">
            <Field label="Nome da fábrica">
              <input
                value={draft.factory}
                onChange={(e) => setDraft({ ...draft, factory: e.target.value })}
                placeholder="Ex.: Bonés do Sul"
                className="mp-inp"
              />
            </Field>
            <div className="border-t border-ink-700 pt-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                Gestor da fábrica
              </p>
              <div className="space-y-3">
                <Field label="Nome do gestor">
                  <input
                    value={draft.managerName}
                    onChange={(e) => setDraft({ ...draft, managerName: e.target.value })}
                    placeholder="Ex.: Maria"
                    className="mp-inp"
                  />
                </Field>
                <Field label="E-mail (login do gestor)">
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    placeholder="gestor@fabrica.com"
                    className="mp-inp"
                  />
                </Field>
                <Field label="Senha (mín. 6 caracteres)">
                  <input
                    type="text"
                    value={draft.password}
                    onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                    placeholder="senha inicial"
                    className="mp-inp"
                  />
                </Field>
              </div>
            </div>
            {err && <p className="text-xs font-semibold text-rose-400">{err}</p>}
          </div>
        )}

        <style jsx>{`
          :global(.mp-inp) {
            width: 100%;
            border-radius: 0.6rem;
            border: 1px solid #26262c;
            background: #0a0a0b;
            padding: 0.55rem 0.75rem;
            font-size: 0.875rem;
            color: #f4f4f5;
            outline: none;
          }
          :global(.mp-inp:focus) {
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
