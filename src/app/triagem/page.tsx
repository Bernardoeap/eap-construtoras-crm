import { prisma } from "@/lib/db";
import Link from "next/link";
import { TriagemForm } from "@/components/TriagemForm";

export const dynamic = "force-dynamic";

export default async function TriagemPage() {
  const [total, semCnae, foraIcp, foraIcpAmostra] = await Promise.all([
    prisma.construtora.count(),
    prisma.construtora.count({ where: { cnaePrincipal: null } }),
    prisma.construtora.count({ where: { tags: { contains: '"fora-do-icp"' } } }),
    prisma.construtora.findMany({
      where: { tags: { contains: '"fora-do-icp"' } },
      select: { id: true, razaoSocial: true, cnaePrincipal: true, uf: true, leadStatus: true },
      take: 30,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-2xl font-bold">Triagem da carteira</h1>
        <p className="text-sm text-slate-500">
          Valida cada CNPJ na Receita Federal. Quem não tem CNAE de construção (41/42/43) é marcado{" "}
          <code className="bg-slate-100 px-1 rounded">fora-do-icp</code> e ocultado da lista.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label="Construtoras na base" value={total} />
        <Card label="Sem CNAE preenchido" value={semCnae} />
        <Card label="Marcadas fora do ICP" value={foraIcp} />
      </section>

      <section className="bg-white border rounded-lg p-5 space-y-3">
        <h2 className="font-semibold">Validar agora</h2>
        <p className="text-sm text-slate-600">
          A rotina consulta BrasilAPI/CNPJá para os CNPJs que ainda não têm CNAE preenchido, e re-classifica
          quem já tem. Empresas com CNAE 41 (edifícios), 42 (infraestrutura) ou 43 (serviços especializados de
          construção) ficam na carteira. As demais ganham tag <code className="bg-slate-100 px-1 rounded">fora-do-icp</code>{" "}
          e status <code className="bg-slate-100 px-1 rounded">perdido</code> (se ainda estavam como{" "}
          <code className="bg-slate-100 px-1 rounded">novo</code>).
        </p>
        <TriagemForm totalConstrutoras={semCnae > 0 ? semCnae : total} />
      </section>

      {foraIcpAmostra.length > 0 && (
        <section className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-3">
            Últimas marcadas fora do ICP ({foraIcp})
          </h2>
          <ul className="divide-y text-sm">
            {foraIcpAmostra.map((c) => (
              <li key={c.id} className="py-2 flex justify-between gap-2">
                <Link href={`/construtoras/${c.id}`} className="hover:text-brand-600 truncate">
                  {c.razaoSocial}
                </Link>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  CNAE {c.cnaePrincipal ?? "—"} · {c.uf}
                </span>
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
