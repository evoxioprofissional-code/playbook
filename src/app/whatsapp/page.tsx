import PageHeader from "@/components/PageHeader";
import WhatsappConnect from "@/components/whatsapp/WhatsappConnect";

export default function WhatsappPage() {
  return (
    <div>
      <PageHeader eyebrow="Conexão · Evolution API" title="WhatsApp" />
      <WhatsappConnect />
    </div>
  );
}
