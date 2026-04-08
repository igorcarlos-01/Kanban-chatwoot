import "./globals.css";
import type { Metadata } from "next";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "CRM Tizze — Gestão de Leads",
  description: "CRM Multi-Pipeline integrado com Chatwoot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans text-gray-900 bg-surface h-screen overflow-hidden flex flex-col">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
