import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusForm } from "@/components/StatusForm";
import { NotaForm } from "@/components/NotaForm";
import { ReuniaoForm, MarcarStatusBtn } from "@/components/ReuniaoForm";
import { EnrichBtn } from "@/components/EnrichBtn";
import { DecisorCard } from "@/components/DecisorCard";
import { TIPO_OBRA_LABEL, FAIXAS_LABEL } from "@/lib/classify";
import { formatBRL, formatDateBR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ConstrutoraDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.construtora.findUnique({
    where: { id },
    include: {
      contratos: { orderBy: { vigenciaInicio: "desc" } },
      decisores: { orderBy: { createdAt: "desc" } },
      interacoes: { orderBy: { criadoEm: "desc" }, take: 30 },
      reunioes: { orderBy: { dataHora: "desc" } },
    },
  });
  if (!c) notFound();

  const valorTotal = c.contratos.reduce((s, x) => s + (x.valorGlobal ?? 0), 0);
  const tags: string[] = c.tags ? JSON.parse(c.tags) : [];
  const qsa: Array<{ nome_socio?: string; qualificacao_socio?: string }> = c.qsa ? JSON.parse(c.qsa) : [];

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link href="/construtoras" className="text-sm text-brand-600 hover:underline">← Construtoras</Link>
          <h1 className="text-2xl font-bold mt-1">{c.razaoSocial}</h1>
          <div className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            <span className="font-mono">{c.cnpj}</span>
            <span>·</span>
            <span>{c.cidade ? `${c.cidade}/${c.uf}` : c.uf}</span>
            {c.site && (
              <>
                <span>·</span>
                <a href={c.site.startsWith("http") ? c.site : `https://${c.site}`} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                  {c.site}
                </a>
              </>
            )}
            {tags.map((t) => (
              <span key={t} className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs">{t}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={c.leadStatus} />
          <StatusForm construtoraId={c.id} current={c.leadStatus} />
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card label="Contratos" value={c.contratos.length.toString()} />
        <Card label="Valor total" value={formatBRL(valorTotal)} />
        <Card label="Decisores" value={c.decisores.length.toString()} />
        <Card label="Faixa estimada" value={c.faixaFaturamento ? FAIXAS_LABEL[c.faixaFaturamento as keyof typeof FAIXAS_LABEL] ?? c.faixaFaturamento : "—"} />
      </section>

      <section className="bg-white border rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Cadastro</h2>
          <EnrichBtn cnpj={c.cnpj} />
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Field label="Nome fantasia" value={c.nomeFantasia} />
          <Field label="CNAE principal" value={c.cnaePrincipal} />
          <Field label="E-mail" value={c.email} mono />
          <Field label="Telefone" value={c.telefone} mono />
          <Field label="Capital social" value={c.capitalSocial != null ? formatBRL(c.capitalSocial) : null} />
          <Field label="Faturamento estimado" value={c.faturamentoEstimado != null ? formatBRL(c.faturamentoEstimado) : null} />
        </dl>

        {qsa.length > 0 && (
          <div className="pt-2">
            <div className="text-sm font-medium mb-1">Sócios (QSA)</div>
            <ul className="text-sm space-y-1">
              {qsa.map((s, i) => (
                <li key={i} className="text-slate-700">
                  • {s.nome_socio} <span className="text-slate-500">— {s.qualificacao_socio}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold mb-3">Contratos vencidos ({c.contratos.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2 pr-3">Objeto</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">Órgão</th>
                <th className="py-2 pr-3">UF/Mun</th>
                <th className="py-2 pr-3">Valor</th>
                <th className="py-2 pr-3">Vigência</th>
                <th className="py-2 pr-3">Link</th>
              </tr>
            </thead>
            <tbody>
              {c.contratos.map((ct) => (
                <tr key={ct.id} className="border-t align-top">
                  <td className="py-2 pr-3 max-w-md">{ct.objeto}</td>
                  <td className="py-2 pr-3">{ct.tipoObra ? TIPO_OBRA_LABEL[ct.tipoObra as keyof typeof TIPO_OBRA_LABEL] : "—"}</td>
                  <td className="py-2 pr-3">{ct.orgaoContratante ?? "—"}</td>
                  <td className="py-2 pr-3">{ct.uf}{ct.municipio ? ` / ${ct.municipio}` : ""}</td>
                  <td className="py-2 pr-3 font-mono whitespace-nowrap">{formatBRL(ct.valorGlobal)}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{formatDateBR(ct.vigenciaInicio)} → {formatDateBR(ct.vigenciaFim)}</td>
                  <td className="py-2 pr-3">
                    {ct.linkPncp && (
                      <a href={ct.linkPncp} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">PNCP ↗</a>
                    )}
                  </td>
                </tr>
              ))}
              {c.contratos.length === 0 && (
                <tr><td colSpan={7} className="py-4 text-center text-slate-500">Sem contratos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-3">Decisores ({c.decisores.length})</h2>
          <ul className="divide-y">
            {c.decisores.map((d) => (
              <DecisorCard key={d.id} decisor={d} empresa={c.razaoSocial} />
            ))}
            {c.decisores.length === 0 && (
              <li className="py-4 text-center text-sm text-slate-500">
                Nenhum decisor mapeado. Clique em <strong>"Enriquecer (BrasilAPI)"</strong> acima para puxar
                os sócios direto da Receita Federal.
              </li>
            )}
          </ul>
        </div>

        <div className="bg-white border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold">Agendar reunião</h2>
          <ReuniaoForm construtoraId={c.id} />
          {c.reunioes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mt-4 mb-2">Histórico</h3>
              <ul className="divide-y">
                {c.reunioes.map((r) => (
                  <li key={r.id} className="py-2 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{r.titulo}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(r.dataHora).toLocaleString("pt-BR")} · status: {r.status}
                      </div>
                    </div>
                    {r.status === "agendada" && (
                      <div className="flex gap-1">
                        <MarcarStatusBtn reuniaoId={r.id} status="realizada" />
                        <MarcarStatusBtn reuniaoId={r.id} status="no-show" />
                        <MarcarStatusBtn reuniaoId={r.id} status="cancelada" />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-5 space-y-3">
          <h2 className="font-semibold">Adicionar nota / interação</h2>
          <NotaForm construtoraId={c.id} />
        </div>

        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-3">Histórico ({c.interacoes.length})</h2>
          <ul className="divide-y max-h-96 overflow-y-auto">
            {c.interacoes.map((i) => (
              <li key={i.id} className="py-2">
                <div className="text-xs text-slate-500">
                  {new Date(i.criadoEm).toLocaleString("pt-BR")} · {i.tipo}
                </div>
                <div className="text-sm">{i.descricao}</div>
              </li>
            ))}
            {c.interacoes.length === 0 && (
              <li className="py-4 text-center text-sm text-slate-500">Sem interações ainda.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={mono ? "font-mono" : ""}>{value && value.length ? value : "—"}</dd>
    </div>
  );
}
