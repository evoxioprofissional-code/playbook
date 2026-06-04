import PageHeader from "@/components/PageHeader";
import KanbanBoard from "@/components/crm/KanbanBoard";

export default function CrmPage() {
  return (
    <div>
      <PageHeader eyebrow="Gestão de leads · arraste para mover" title="CRM Kanban" />
      <KanbanBoard />
    </div>
  );
}
