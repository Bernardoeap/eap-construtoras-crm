import { prisma } from "@/lib/db";
import Link from "next/link";
import { TriagemForm } from "@/components/TriagemForm";

export const dynamic = "force-dynamic";

export default async function TriagemPage() {
  const [total, foraIcp, foraIcpAmostra] = await Promise.all([
    prisma.construtora.count(),
    prisma.construtora.count({ where: { tags: { contains: '"fora-do-icp"' } } }),
    prisma.construtora.findMany({
      where: { tags: { contains: '"fora-do-icp"' } },
      select: { id: true, razaoSocial: true, cnaePrincipal: true, uf: true, leadStatus: true, contratos: { select: { objeto: true }, take: 1 } },
      take: 30,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-2xl font-bold">Triagem da carteira</h1>
        <p className="text-sm text-slate-500">
          Classifica cada construtora pelo <strong>objeto dos contratos</strong> que ela ganhou. Se pelo
          menos um contrato envolver construção, reforma, ampliação, pavimentação, saneamento, edificação
          (etc.), fica na carteira. Caso contrário, vira{" "}
          <code className="bg-slate-100 px-1 rounded">fora-do-icp</code>.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card label="Construtoras na base" value={total} />
        <Card label="Marcadas fora do ICP" value={foraIcp} />
      </section>

      <section className="bg-white border rounded-lg p-5 space-y-3">
        <h2 className="font-semibold">Validar agora</h2>
        <p className="text-sm text-slate-600">
          Roda em segundos. Empresas que <strong>tinham</strong> tag{" "}
          <code className="bg-slate-100 px-1 rounded">fora-do-icp</code> erroneamente (ex.: a regra antiga
          marcou pelo CNAE) são <strong>restauradas automaticamente</strong> se algum contrato delas envolve
          obra civil.
        </p>
        <TriagemForm />
      </section>

      {foraIcpAmostra.length > 0 && (
        <section className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-3">
            Últimas marcadas fora do ICP ({foraIcp})
          </h2>
          <ul className="divide-y text-sm">
            {foraIcpAmostra.map((c) => (
              <li key={c.id} className="py-2">
                <Link href={`/construtoras/${c.id}`} className="font-medium hover:text-brand-600 truncate block">
                  {c.razaoSocial}
                </Link>
                <div className="text-xs text-slate-500 truncate">
                  {c.uf} · {c.contratos[0]?.objeto?.slice(0, 120) ?? "(sem contrato)"}
                  {(c.contratos[0]?.objeto?.length ?? 0) > 120 ? "…" : ""}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value.toLocaleString("pt-BR")}</div>
    </div>
  );
}
