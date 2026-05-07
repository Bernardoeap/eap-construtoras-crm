import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "EAP · CRM Construtoras",
  description: "Prospecção de construtoras com licitações públicas (PNCP).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex bg-slate-50 text-slate-900">
        <Sidebar />
        <main className="flex-1 min-h-screen">
          <div className="max-w-[1400px] mx-auto px-6 py-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
