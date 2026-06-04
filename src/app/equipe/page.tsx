import PageHeader from "@/components/PageHeader";
import TeamBoard from "@/components/team/TeamBoard";

export default function EquipePage() {
  return (
    <div>
      <PageHeader eyebrow="Acompanhamento · 3 funcionários" title="Equipe" />
      <TeamBoard />
    </div>
  );
}
