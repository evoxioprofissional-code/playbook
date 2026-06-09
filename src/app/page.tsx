import PageHeader from "@/components/PageHeader";
import PhaseBoard from "@/components/dashboard/PhaseBoard";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard Mensal">
        <span className="hidden rounded-full bg-ink-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 ring-1 ring-ink-600 sm:inline">
          Alicerce → Escala
        </span>
      </PageHeader>
      <PhaseBoard />
    </div>
  );
}
