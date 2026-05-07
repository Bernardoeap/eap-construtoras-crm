import { prisma } from "@/lib/db";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { TIPO_OBRA_LABEL, FAIXAS_LABEL, STATUS_ORDEM, STATUS_LABEL } from "@/lib/classify";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

interface SearchParams {
  uf?: string;
  tipo?: string;
  status?: string;
  faixa?: string;
  q?: string;
  tag?: string;
  arquivadas?: string;
}

export default async function ConstrutorasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const mostrarArquivadas = sp.arquivadas === "1";

  // Por padrao esconde quem esta marcado como 'perdido' (= arquivado).
  // Se o usuario filtrou por um status especifico, respeita o filtro dele.
  const statusFilter = sp.status
    ? sp.status
    : mostrarArquivadas
      ? undefined
      : { not: "perdido" };

  const construtoras = await prisma.construtora.findMany({
    where: {
      uf: sp.uf || undefined,
      leadStatus: statusFilter,
      faixaFaturamento: sp.faixa || undefined,
      tags: sp.tag ? { contains: `"${sp.tag}"` } : undefined,
      OR: sp.q
        ? [
            { razaoSocial: { contains: sp.q } },
            { cnpj: { contains: sp.q } },
            { nomeFantasia: { contains: sp.q } },
          ]
        : undefined,
    },
    include: {
      contratos: { select: { valorGlobal: true, tipoObra: true } },
      _count: { select: { contratos: true, decisores: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  // filtro por tipoObra é em memória (contratos pode ter vários tipos)
  const filtered = sp.tipo
    ? construtoras.filter((c) => c.contratos.some((ct) => ct.tipoObra === sp.tipo))
    : construtoras;

  const ufsDisponiveis = await prisma.construtora.findMany({
    distinct: ["uf"],
    select: { uf: true },
    orderBy: { uf: "asc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Construtoras</h1>
          <p className="text-sm text-slate-500">
            {filtered.length} construtoras na visão atual
            {!mostrarArquivadas && !sp.status && " · perdidas ocultas"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={mostrarArquivadas ? "/construtoras" : "/construtoras?arquivadas=1"}
            className="px-3 py-2 rounded-md border bg-white text-sm hover:bg-slate-100"
          >
            {mostrarArquivadas ? "Esconder perdidas" : "Mostrar perdidas"}
          </Link>
          <Link href="/sync" className="px-4 py-2 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600">
            ↻ Atualizar (PNCP)
          </Link>
        </div>
      </header>

      <form className="bg-white border rounded-lg p-4 grid grid-cols-2 md:grid-cols-6 gap-3" action="/construtoras" method="get">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar razão / CNPJ"
          className="md:col-span-2 px-3 py-2 border rounded-md text-sm"
        />
        <select name="uf" defaultValue={sp.uf ?? ""} className="px-3 py-2 border rounded-md text-sm">
          <option value="">Todas UFs</option>
          {ufsDisponiveis.map((u) => (
            <option key={u.uf} value={u.uf}>
              {u.uf}
            </option>
          ))}
        </select>
        <select name="tipo" defaultValue={sp.tipo ?? ""} className="px-3 py-2 border rounded-md text-sm">
          <option value="">Todo tipo de obra</option>
          {Object.entries(TIPO_OBRA_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="px-3 py-2 border rounded-md text-sm">
          <option value="">Todos status</option>
          {STATUS_ORDEM.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select name="faixa" defaultValue={sp.faixa ?? ""} className="px-3 py-2 border rounded-md text-sm">
          <option value="">Toda faixa</option>
          {Object.entries(FAIXAS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="md:col-span-6 px-3 py-2 rounded-md bg-slate-900 text-white text-sm">
          Aplicar filtros
        </button>
      </form>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Razão social</th>
              <th className="px-4 py-3 font-medium">UF</th>
              <th className="px-4 py-3 font-medium">Contratos</th>
              <th className="px-4 py-3 font-medium">Valor total</th>
              <th className="px-4 py-3 font-medium">Decisores</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const valor = c.contratos.reduce((s, x) => s + (x.valorGlobal ?? 0), 0);
              return (
                <tr key={c.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/construtoras/${c.id}`} className="font-medium hover:text-brand-600">
                      {c.razaoSocial}
                    </Link>
                    <div className="text-xs text-slate-500">{c.cnpj}</div>
                  </td>
                  <td className="px-4 py-3">{c.uf}</td>
                  <td className="px-4 py-3">{c._count.contratos}</td>
                  <td className="px-4 py-3 font-mono">{formatBRL(valor)}</td>
                  <td className="px-4 py-3">{c._count.decisores}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.leadStatus} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  Nenhuma construtora encontrada com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
