import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { SessionProvider } from "@/components/team/session";
import AuthGate from "@/components/team/AuthGate";

export const metadata: Metadata = {
  title: "J2A Sales Machine",
  description: "Playbook comercial e CRM da fábrica J2A Bonés.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-ink-950 bg-grain font-sans text-zinc-100 antialiased">
        <SessionProvider>
          <AuthGate>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 overflow-x-hidden md:pl-0">{children}</main>
            </div>
          </AuthGate>
        </SessionProvider>
      </body>
    </html>
  );
}
