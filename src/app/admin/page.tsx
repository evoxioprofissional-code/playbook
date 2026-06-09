import PageHeader from "@/components/PageHeader";
import AdminTabs from "@/components/admin/AdminTabs";

export default function AdminPage() {
  return (
    <div>
      <PageHeader eyebrow="Administração · equipe, funções e playbook" title="Admin" />
      <AdminTabs />
    </div>
  );
}
