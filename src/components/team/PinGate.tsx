"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Delete, ShieldCheck, UserRound } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { fetchEmployees, type Employee } from "@/lib/store";
import { useSession } from "./session";

export default function PinGate({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { login } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open) fetchEmployees().then(setEmployees);
  }, [open]);

  const reset = () => {
    setSelected(null);
    setPin("");
    setError(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const press = (d: string) => {
    setError(false);
    setPin((p) => (p.length >= 4 ? p : p + d));
  };

  // Confirma quando o PIN chega a 4 dígitos.
  useEffect(() => {
    if (!selected || pin.length !== 4) return;
    if (pin === selected.pin) {
      login({
        id: selected.id,
        name: selected.name,
        role: selected.role,
        areas: selected.areas ?? null,
      });
      close();
    } else {
      setError(true);
      setTimeout(() => setPin(""), 350);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <Modal
      open={open}
      onClose={close}
      title={selected ? `PIN de ${selected.name}` : "Quem está usando?"}
      subtitle={
        selected
          ? "Digite seu PIN de 4 dígitos para registrar suas tarefas."
          : "Selecione seu nome para entrar."
      }
    >
      {!selected ? (
        <ul className="space-y-2">
          {employees.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => setSelected(e)}
                className="flex w-full items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 px-3 py-3 text-left transition hover:border-flame-500/40"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 text-flame-400">
                  {e.role === "gestor" ? (
                    <ShieldCheck size={18} />
                  ) : (
                    <UserRound size={18} />
                  )}
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">
                    {e.name}
                  </span>
                  <span className="block text-[11px] uppercase tracking-wide text-zinc-500">
                    {e.role}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <div className="mb-4 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-3.5 w-3.5 rounded-full transition ${
                  error
                    ? "bg-rose-500"
                    : pin.length > i
                      ? "bg-flame-500"
                      : "bg-ink-700"
                }`}
              />
            ))}
          </div>
          {error && (
            <p className="mb-3 text-center text-xs font-semibold text-rose-400">
              PIN incorreto. Tente de novo.
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <Key key={d} onClick={() => press(d)}>
                {d}
              </Key>
            ))}
            <button
              onClick={() => setSelected(null)}
              className="rounded-xl bg-ink-800 py-3 text-xs font-bold text-zinc-400 hover:text-white"
            >
              Voltar
            </button>
            <Key onClick={() => press("0")}>0</Key>
            <button
              onClick={() => setPin((p) => p.slice(0, -1))}
              className="flex items-center justify-center rounded-xl bg-ink-800 py-3 text-zinc-400 hover:text-white"
              aria-label="Apagar"
            >
              <Delete size={18} />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Key({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-ink-800 py-3 text-lg font-extrabold text-white transition hover:bg-ink-700 active:scale-95"
    >
      {children}
    </button>
  );
}
