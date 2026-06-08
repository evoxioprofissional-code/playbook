"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Flame, GripVertical, Plus, Timer, Target } from "lucide-react";
import {
  COLUMNS,
  SEED_LEADS,
  META_MES,
  formatBRL,
  formatAge,
  slaStatus,
  type ColumnId,
  type Lead,
} from "@/lib/kanban";
import Modal from "@/components/ui/Modal";

export default function KanbanBoard() {
  const [leads, setLeads] = useState<Lead[]>(SEED_LEADS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // now=0 até montar no cliente (evita divergência de hidratação no relógio).
  const [now, setNow] = useState(0);

  // Relógio do SLA — atualiza a cada segundo.
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const activeLead = leads.find((l) => l.id === activeId) || null;

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const over = e.over?.id as ColumnId | undefined;
    if (!over) return;
    setLeads((prev) =>
      prev.map((l) => (l.id === e.active.id ? { ...l, column: over } : l))
    );
  };

  const pipeline = leads
    .filter((l) => l.column !== "ganho")
    .reduce((s, l) => s + l.value, 0);
  const won = leads
    .filter((l) => l.column === "ganho")
    .reduce((s, l) => s + l.value, 0);
  const goalPct = Math.min(100, Math.round((won / META_MES) * 100));
  const slaBreaches = leads.filter(
    (l) => l.column === "novo" && !slaStatus(l.createdAt, now).ok
  ).length;

  return (
    <div className="flex h-[calc(100vh-89px)] flex-col">
      {/* Resumo */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-4 sm:px-8">
        <Kpi label="No funil" value={formatBRL(pipeline)} tone="flame" />
        <Kpi label="Fechado no mês" value={formatBRL(won)} tone="emerald" />
        {slaBreaches > 0 && (
          <Kpi label="Responder já!" value={String(slaBreaches)} tone="rose" />
        )}

        <div className="min-w-[170px] rounded-xl bg-ink-900 px-4 py-2 ring-1 ring-ink-700">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            <span className="flex items-center gap-1">
              <Target size={11} className="text-flame-400" /> Meta do mês
            </span>
            <span className="text-flame-400">{goalPct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-flame-500 to-gold-500 transition-all duration-700"
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => setAdding(true)}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-flame-500 px-3.5 py-2 text-sm font-bold text-black transition hover:bg-flame-400"
        >
          <Plus size={16} strokeWidth={2.6} /> Novo lead
        </button>
      </div>

      {now === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-600">
          Carregando leads…
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex flex-1 gap-4 overflow-x-auto px-6 pb-6 sm:px-8">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                col={col}
                leads={leads.filter((l) => l.column === col.id)}
                now={now}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeLead ? <LeadCard lead={activeLead} now={now} overlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <NewLeadModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreate={(lead) => {
          setLeads((p) => [...p, lead]);
          setAdding(false);
        }}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "flame" | "emerald" | "zinc" | "rose";
}) {
  const ring = {
    flame: "ring-flame-500/30",
    emerald: "ring-emerald-500/30",
    zinc: "ring-ink-600",
    rose: "ring-rose-500/40",
  }[tone];
  const text = {
    flame: "text-flame-400",
    emerald: "text-emerald-300",
    zinc: "text-white",
    rose: "text-rose-400",
  }[tone];
  return (
    <div className={`rounded-xl bg-ink-900 px-4 py-2.5 ring-1 ${ring}`}>
      <p className={`text-lg font-extrabold leading-none ${text}`}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function KanbanColumn({
  col,
  leads,
  now,
}: {
  col: (typeof COLUMNS)[number];
  leads: Lead[];
  now: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const total = leads.reduce((s, l) => s + l.value, 0);

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${col.accent}`} />
          <h3 className="text-sm font-bold text-white">{col.title}</h3>
          <span className="rounded-full bg-ink-800 px-1.5 text-[11px] font-bold text-zinc-400">
            {leads.length}
          </span>
        </div>
      </div>
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
        {col.hint} · {formatBRL(total)}
      </p>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2.5 rounded-xl border border-dashed p-2 transition ${
          isOver
            ? "border-flame-500/60 bg-flame-500/5"
            : "border-ink-700 bg-ink-900/40"
        }`}
      >
        {leads.map((lead) => (
          <DraggableLead key={lead.id} lead={lead} now={now} />
        ))}
        {leads.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-zinc-600">
            Arraste um lead aqui
          </p>
        )}
      </div>
    </div>
  );
}

function DraggableLead({ lead, now }: { lead: Lead; now: number }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`touch-none ${isDragging ? "opacity-30" : ""}`}
    >
      <LeadCard lead={lead} now={now} />
    </div>
  );
}

function LeadCard({
  lead,
  now,
  overlay,
}: {
  lead: Lead;
  now: number;
  overlay?: boolean;
}) {
  const isNew = lead.column === "novo";
  const sla = isNew && now > 0 ? slaStatus(lead.createdAt, now) : null;

  return (
    <div
      className={`group cursor-grab rounded-xl border bg-ink-850 p-3 active:cursor-grabbing ${
        overlay
          ? "rotate-2 border-flame-500/60 shadow-glow"
          : sla && !sla.ok
            ? "border-rose-500/60 ring-1 ring-rose-500/30"
            : "border-ink-700 hover:border-flame-500/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold leading-tight text-white">{lead.name}</p>
          <p className="text-xs text-zinc-500">{lead.company}</p>
        </div>
        <GripVertical
          size={15}
          className="mt-0.5 shrink-0 text-zinc-600 group-hover:text-zinc-400"
        />
      </div>

      {/* SLA do lead novo */}
      {sla && (
        <div
          className={`mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold ${
            sla.ok
              ? "bg-emerald-500/15 text-emerald-300"
              : "animate-pulse bg-rose-500/20 text-rose-300"
          }`}
        >
          <Timer size={12} />
          {sla.ok ? `Responder em ${sla.label}` : `SLA estourou há ${sla.label}`}
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
            lead.type === "Revenda"
              ? "bg-sky-500/15 text-sky-300"
              : "bg-violet-500/15 text-violet-300"
          }`}
        >
          {lead.type}
        </span>
        <span className="rounded-md bg-ink-700 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
          {lead.qty} pç
        </span>
        {lead.hot && (
          <span className="flex items-center gap-0.5 rounded-md bg-flame-500/15 px-1.5 py-0.5 text-[10px] font-bold text-flame-400">
            <Flame size={10} /> Quente
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <p className="text-sm font-extrabold text-gold-400">
          {formatBRL(lead.value)}
        </p>
        <p className="text-[10px] font-medium text-zinc-600">
          {formatAge(lead.createdAt, now)}
        </p>
      </div>
    </div>
  );
}

function NewLeadModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (lead: Lead) => void;
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState<Lead["type"]>("Revenda");
  const [qty, setQty] = useState(100);

  const reset = () => {
    setName("");
    setCompany("");
    setType("Revenda");
    setQty(100);
  };

  const submit = () => {
    if (!name.trim()) return;
    onCreate({
      id: `l-${Date.now()}`,
      name: name.trim(),
      company: company.trim() || "—",
      type,
      qty,
      value: qty * 26,
      column: "novo",
      createdAt: new Date().toISOString(),
    });
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo lead"
      subtitle="Entra direto na coluna Lead Novo · SLA 5 min."
      footer={
        <button
          onClick={submit}
          disabled={!name.trim()}
          className={`w-full rounded-xl py-2.5 text-sm font-bold transition ${
            name.trim()
              ? "bg-flame-500 text-black hover:bg-flame-400"
              : "cursor-not-allowed bg-ink-700 text-zinc-500"
          }`}
        >
          Adicionar ao pipeline
        </button>
      }
    >
      <div className="space-y-3">
        <Field label="Contato">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do lead"
            className="input"
          />
        </Field>
        <Field label="Marca / Empresa">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Ex.: RD Streetwear"
            className="input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Lead["type"])}
              className="input"
            >
              <option>Revenda</option>
              <option>Marca própria</option>
            </select>
          </Field>
          <Field label="Quantidade (pç)">
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className="input"
            />
          </Field>
        </div>
        <p className="text-[11px] text-zinc-500">
          Valor estimado: {formatBRL(qty * 26)} (R$ 26/pç de referência)
        </p>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.6rem;
          border: 1px solid #26262c;
          background: #101012;
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          color: #f4f4f5;
          outline: none;
        }
        :global(.input:focus) {
          border-color: #ff6b1a;
        }
      `}</style>
    </Modal>
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
