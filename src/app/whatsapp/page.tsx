import PageHeader from "@/components/PageHeader";
import WhatsappClient from "@/components/whatsapp/WhatsappClient";

export default function WhatsappPage() {
  return (
    <div>
      <PageHeader title="WhatsApp" />
      <WhatsappClient />
    </div>
  );
}
