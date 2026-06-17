"use client";

import { useState } from "react";
import { Users, ClipboardList, Building2, Lock } from "lucide-react";
import { useSession } from "@/components/team/session";
import AdminPanel from "./AdminPanel";
import PlaybookEditor from "./PlaybookEditor";
import MasterPanel from "./MasterPanel";

type Tab = "fabricas" | "funcionarios" | "playbook";

export default function AdminTabs() {
  const { user } = useSession();
  const isMaster = user?.role === "master";
  const [tab, setTab] = useState<Tab>(isMaster ? "fabricas" : "funcionarios");

  // Acesso só pro gestor ou master.
  if (!user || (user.role !== "gestor" && user.role !== "master")) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <Lock size={36} className="text-zinc-600" />
        <h2 className="mt-3 text-lg font-extrabold text-white">Área restrita</h2>
        <p className="mt-1 max-w-sm text-sm text-zinc-400">
          O painel de administração é só para o <b>Gestor</b> ou o <b>dono do sistema</b>.
          Entre com o login certo para acessar.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1 border-b border-ink-700 px-6 sm:px-8">
        {isMaster && (
          <TabBtn
            icon={Building2}
            label="Fábricas"
            active={tab === "fabricas"}
            onClick={() => setTab("fabricas")}
          />
        )}
        <TabBtn
          icon={Users}
          label="Funcionários"
          active={tab === "funcionarios"}
          onClick={() => setTab("funcionarios")}
        />
        <TabBtn
          icon={ClipboardList}
          label="Playbook"
          active={tab === "playbook"}
          onClick={() => setTab("playbook")}
        />
      </div>

      {tab === "fabricas" && isMaster ? (
        <MasterPanel />
      ) : tab === "funcionarios" ? (
        <AdminPanel />
      ) : (
        <PlaybookEditor />
      )}
    </div>
  );
}

function TabBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
        active
          ? "border-flame-500 text-white"
          : "border-transparent text-zinc-400 hover:text-white"
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}
