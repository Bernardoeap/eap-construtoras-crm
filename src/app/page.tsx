import { prisma } from "@/lib/db";
import Link from "next/link";
import { STATUS_LABEL, STATUS_ORDEM } from "@/lib/classify";
import { formatBRL } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalConstrutoras, totalContratos, valorAgg, statusCounts, topConstrutoras, reunioesSemana] = await Promise.all([
    prisma.construtora.count(),
    prisma.contrato.count(),
    prisma.contrato.aggregate({ _sum: { valorGlobal: true } }),
    prisma.construtora.groupBy({ by: ["leadStatus"], _count: { _all: true } }),
    prisma.construtora.findMany({
      take: 5,
      orderBy: { contratos: { _count: "desc" } },
      include: { contratos: { select: { valorGlobal: true } }, _count: { select: { contratos: true, decisores: true } } },
    }),
    prisma.reuniao.findMany({
      where: { dataHora: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
      include: { construtora: { select: { id: true, razaoSocial: true } } },
      orderBy: { dataHora: "asc" },
      take: 8,
    }),
  ]);

  const statusMap = Object.fromEntries(statusCounts.map((s) => [s.leadStatus, s._count._all]));
  const valorTotal = valorAgg._sum.valorGlobal ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">Visão geral do pipeline de construtoras públicas.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Construtoras" value={totalConstrutoras.toLocaleString("pt-BR")} />
        <Card label="Contratos vencidos" value={totalContratos.toLocaleString("pt-BR")} />
        <Card label="Valor total em contratos" value={formatBRL(valorTotal)} />
        <Card label="Reuniões nos próximos 7 dias" value={reunioesSemana.length.toString()} />
      </section>

      <section className="bg-white rounded-lg border p-5">
        <h2 className="font-semibold mb-3">Funil de pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          {STATUS_ORDEM.map((s) => (
            <div key={s} className="border rounded-md p-3 bg-slate-50">
              <div className="text-xs text-slate-500">{STATUS_LABEL[s]}</div>
              <div className="text-2xl font-bold mt-1">{statusMap[s] ?? 0}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Top construtoras (por nº de contratos)</h2>
            <Link href="/construtoras" className="text-sm text-brand-600 hover:underline">ver todas →</Link>
          </div>
          <ul className="divide-y">
            {topConstrutoras.map((c) => {
              const valor = c.contratos.reduce((s, x) => s + (x.valorGlobal ?? 0), 0);
              return (
                <li key={c.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/construtoras/${c.id}`} className="font-medium hover:text-brand-600 truncate block">
                      {c.razaoSocial}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {c.uf} · {c._count.contratos} contratos · {c._count.decisores} decisores
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatBRL(valor)}</div>
                    <StatusBadge status={c.leadStatus} />
                  </div>
                </li>
              );
            })}
            {topConstrutoras.length === 0 && (
              <li className="py-6 text-sm text-slate-500 text-center">
                Nenhuma construtora ainda. Rode <code className="bg-slate-100 px-1">npm run seed</code>.
              </li>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <h2 className="font-semibold mb-3">Próximas reuniões</h2>
          <ul className="divide-y">
            {reunioesSemana.map((r) => (
              <li key={r.id} className="py-3">
                <div className="text-sm font-medium">{r.titulo}</div>
                <div className="text-xs text-slate-500">
                  {new Date(r.dataHora).toLocaleString("pt-BR")} ·{" "}
                  <Link href={`/construtoras/${r.construtora.id}`} className="text-brand-600 hover:underline">
                    {r.construtora.razaoSocial}
                  </Link>
                </div>
              </li>
            ))}
            {reunioesSemana.length === 0 && (
              <li className="py-6 text-sm text-slate-500 text-center">Nenhuma reunião agendada.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
