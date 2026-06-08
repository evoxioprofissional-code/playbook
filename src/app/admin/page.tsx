import PageHeader from "@/components/PageHeader";
import AdminPanel from "@/components/admin/AdminPanel";

export default function AdminPage() {
  return (
    <div>
      <PageHeader eyebrow="Administração · equipe e funções" title="Admin" />
      <AdminPanel />
    </div>
  );
}
