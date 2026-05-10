import Link from "next/link";
import { prisma } from "@/lib/db";

export async function Sidebar() {
  const aConfirmar = await prisma.construtora.count({
    where: {
      leadStatus: { not: "perdido" },
      decisores: { some: { confirmado: false } },
    },
  });

  const NAV = [
    { href: "/", label: "Dashboard", icon: "□", badge: 0 },
    { href: "/construtoras", label: "Construtoras", icon: "▦", badge: 0 },
    { href: "/prospeccao", label: "Prospecção", icon: "🎯", badge: aConfirmar },
    { href: "/relatorios", label: "Relatórios", icon: "◷", badge: 0 },
    { href: "/sync", label: "Atualizar (PNCP)", icon: "↻", badge: 0 },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 border-r bg-white min-h-screen">
      <div className="px-5 py-5 border-b">
        <div className="text-lg font-bold text-brand-700">EAP · CRM</div>
        <div className="text-xs text-slate-500">Construtoras públicas</div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100"
          >
            <span className="text-base text-brand-500 w-4 text-center">{n.icon}</span>
            <span className="flex-1">{n.label}</span>
            {n.badge > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                {n.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-3 text-[11px] text-slate-400 border-t">
        Dados públicos · PNCP / BrasilAPI
      </div>
    </aside>
  );
}
