import { prisma } from "@/lib/db";
import Link from "next/link";
import { LinkedInSearchPanel } from "@/components/LinkedInSearchPanel";
import { AdicionarDecisorBtn } from "@/components/AdicionarDecisorBtn";
import { MarcarTrabalhadaBtn } from "@/components/MarcarTrabalhadaBtn";
import { TIPO_OBRA_LABEL, FAIXAS_LABEL } from "@/lib/classify";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

interface SearchParams {
  id?: string;
}

export default async function ProspeccaoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;

  // Fila: construtoras que ainda não tiveram NENHUM decisor com LinkedIn enviado,
  // que não estão arquivadas (perdido), e ordenadas por valor total descendente.
  const candidatas = await prisma.construtora.findMany({
    where: {
      leadStatus: { not: "perdido" },
      decisores: { none: { linkedinContatado: true } },
      // Excluir construtoras que já tiveram sessão de prospecção (interação prospeccao_linkedin)
      interacoes: { none: { tipo: "prospeccao_linkedin" } },
    },
    include: {
      contratos: {
        select: { valorGlobal: true, objeto: true, vigenciaFim: true, tipoObra: true, orgaoContratante: true, municipio: true },
        orderBy: { valorGlobal: "desc" },
      },
      decisores: { orderBy: { createdAt: "desc" } },
    },
  });

  // Ordena por valor total descendente em memória
  const fila = candidatas
    .map((c) => ({
      construtora: c,
      valorTotal: c.contratos.reduce((s, x) => s + (x.valorGlobal ?? 0), 0),
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal);

  // Atual: se tem id na URL, busca na fila; senão pega a primeira
  const atual = sp.id
    ? fila.find((f) => f.construtora.id === sp.id) ?? fila[0]
    : fila[0];

  if (!atual) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Prospecção LinkedIn</h1>
        </header>
        <div className="bg-white border rounded-lg p-12 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-lg font-semibold mb-1">Fila vazia!</h2>
          <p className="text-sm text-slate-600">
            Todas as construtoras ativas já tiveram pelo menos 1 decisor abordado no LinkedIn ou foram marcadas como
            trabalhadas. Se quiser revisitar, tira o status "trabalhada" via histórico de interações da construtora.
          </p>
          <Link href="/construtoras" className="inline-block mt-4 text-sm text-brand-600 hover:underline">
            ← Voltar para construtoras
          </Link>
        </div>
      </div>
    );
  }

  const { construtora: c, valorTotal } = atual;
  const indiceAtual = fila.findIndex((f) => f.construtora.id === c.id);
  const proxima = fila[indiceAtual + 1];

  // Maior contrato (preferindo ativos)
  const agora = new Date();
  const ativos = c.contratos.filter((ct) => !ct.vigenciaFim || ct.vigenciaFim >= agora);
  const principal = (ativos[0] ?? c.contratos[0]) ?? null;

  const qsa: Array<{ nome_socio?: string; qualificacao_socio?: string }> = c.qsa ? JSON.parse(c.qsa) : [];

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Prospecção LinkedIn</h1>
          <p className="text-xs text-slate-500">
            Construtora {indiceAtual + 1} de {fila.length} · ordenadas por valor total decrescente
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/construtoras" className="px-3 py-2 rounded-md border bg-white text-sm hover:bg-slate-100">
            Sair
          </Link>
          {proxima && (
            <Link
              href={`/prospeccao?id=${proxima.construtora.id}`}
              className="px-3 py-2 rounded-md border bg-white text-sm hover:bg-slate-100"
            >
              Pular →
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Coluna esquerda: info da construtora */}
        <aside className="space-y-3">
          <div className="bg-white border rounded-lg p-4">
            <Link href={`/construtoras/${c.id}`} className="text-xs text-brand-600 hover:underline">
              Abrir página completa →
            </Link>
            <h2 className="font-bold mt-1 leading-tight">{c.razaoSocial}</h2>
            <div className="text-xs text-slate-500 font-mono mt-1">{c.cnpj}</div>
            <div className="text-xs text-slate-500 mt-1">
              {c.cidade ? `${c.cidade}/${c.uf}` : c.uf}
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4 space-y-2 text-sm">
            <Stat label="Valor total contratos" value={formatBRL(valorTotal)} />
            <Stat label="Faixa estimada" value={c.faixaFaturamento ? FAIXAS_LABEL[c.faixaFaturamento as keyof typeof FAIXAS_LABEL] ?? c.faixaFaturamento : "—"} />
            <Stat label="Contratos" value={c.contratos.length.toString()} />
            <Stat label="Decisores cadastrados" value={c.decisores.length.toString()} />
          </div>

          {principal && (
            <div className="bg-white border rounded-lg p-4 text-sm">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Maior contrato (gancho)</div>
              <div className="font-medium leading-snug">{principal.objeto}</div>
              <div className="text-xs text-slate-500 mt-1">
                {principal.tipoObra && <span>{TIPO_OBRA_LABEL[principal.tipoObra as keyof typeof TIPO_OBRA_LABEL]} · </span>}
                {principal.orgaoContratante && <span>{principal.orgaoContratante} · </span>}
                {principal.municipio && <span>{principal.municipio}</span>}
              </div>
              {principal.valorGlobal && (
                <div className="font-mono mt-1">{formatBRL(principal.valorGlobal)}</div>
              )}
            </div>
          )}

          {qsa.length > 0 && (
            <div className="bg-white border rounded-lg p-4 text-sm">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Sócios (QSA)</div>
              <ul className="space-y-1 text-xs">
                {qsa.slice(0, 5).map((s, i) => (
                  <li key={i}>• {s.nome_socio} <span className="text-slate-400">— {s.qualificacao_socio}</span></li>
                ))}
              </ul>
            </div>
          )}

          {c.decisores.length > 0 && (
            <div className="bg-white border rounded-lg p-4 text-sm">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Decisores já cadastrados</div>
              <ul className="space-y-1 text-xs">
                {c.decisores.map((d) => (
                  <li key={d.id} className="flex items-center gap-1">
                    {d.linkedinContatado && <span className="text-emerald-600">✓</span>}
                    <span className="font-medium">{d.nome}</span>
                    {d.cargo && <span className="text-slate-500">— {d.cargo}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Coluna direita: busca + adicionar */}
        <div className="space-y-4">
          <LinkedInSearchPanel empresa={c.razaoSocial} />

          <section className="bg-white border rounded-lg p-5 space-y-3">
            <h3 className="font-semibold">Adicionar decisor encontrado</h3>
            <p className="text-xs text-slate-500">
              Clique nos chips do painel acima → ache o perfil → cole a URL aqui pra salvar.
            </p>
            <AdicionarDecisorBtn construtoraId={c.id} />
          </section>

          <section className="bg-white border rounded-lg p-4 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">Não achou ninguém útil?</div>
              <div className="text-xs text-slate-500">
                Marca como trabalhada — sai da fila. Você pode voltar via página da construtora.
              </div>
            </div>
            <MarcarTrabalhadaBtn construtoraId={c.id} proximaId={proxima?.construtora.id} />
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}
