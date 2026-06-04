import PageHeader from "@/components/PageHeader";
import ScriptsLibrary from "@/components/scripts/ScriptsLibrary";

export default function ScriptsPage() {
  return (
    <div>
      <PageHeader eyebrow="Fala pronta · clique para copiar" title="Biblioteca de Scripts" />
      <ScriptsLibrary />
    </div>
  );
}
