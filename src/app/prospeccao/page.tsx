import { prisma } from "@/lib/db";
import Link from "next/link";
import { LinkedInSearchPanel } from "@/components/LinkedInSearchPanel";
import { AdicionarDecisorBtn } from "@/components/AdicionarDecisorBtn";
import { MarcarTrabalhadaBtn } from "@/components/MarcarTrabalhadaBtn";
import { MarcarPerdidoBtn } from "@/components/MarcarPerdidoBtn";
import { ConfirmarDescartarBtns } from "@/components/ConfirmarDescartarBtns";
import { TIPO_OBRA_LABEL, FAIXAS_LABEL } from "@/lib/classify";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

interface SearchParams {
  id?: string;
  tab?: "pesquisar" | "confirmar";
}

export default async function ProspeccaoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const tab = sp.tab ?? "pesquisar";

  // Contadores das duas filas pra mostrar nos tabs
  const [contagemPesquisar, contagemConfirmar] = await Promise.all([
    prisma.construtora.count({
      where: {
        leadStatus: { not: "perdido" },
        decisores: { none: { linkedinContatado: true } },
        AND: [{ decisores: { none: { confirmado: false } } }],
        interacoes: { none: { tipo: "prospeccao_linkedin" } },
      },
    }),
    prisma.construtora.count({
      where: {
        leadStatus: { not: "perdido" },
        decisores: { some: { confirmado: false } },
      },
    }),
  ]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Prospecção LinkedIn</h1>
          <p className="text-xs text-slate-500">
            Pesquise e confirme decisores em duas etapas pra evitar contatar perfil errado.
          </p>
        </div>
        <Link href="/construtoras" className="px-3 py-2 rounded-md border bg-white text-sm hover:bg-slate-100">
          Sair
        </Link>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <TabLink tab="pesquisar" current={tab} count={contagemPesquisar} label="🎯 A pesquisar" />
        <TabLink tab="confirmar" current={tab} count={contagemConfirmar} label="❓ A confirmar" />
      </div>

      {tab === "pesquisar" ? (
        <AbaPesquisar idAtual={sp.id} />
      ) : (
        <AbaConfirmar idAtual={sp.id} />
      )}
    </div>
  );
}

function TabLink({
  tab,
  current,
  count,
  label,
}: {
  tab: "pesquisar" | "confirmar";
  current: "pesquisar" | "confirmar";
  count: number;
  label: string;
}) {
  const ativo = tab === current;
  return (
    <Link
      href={`/prospeccao?tab=${tab}`}
      className={`px-4 py-2 text-sm font-medium rounded-t-md ${
        ativo
          ? "bg-white border border-b-white border-slate-200 text-slate-900"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {label} <span className={`ml-1 ${ativo ? "text-brand-600" : "text-slate-400"}`}>({count})</span>
    </Link>
  );
}

// ============================================================================
// Aba "A pesquisar" — fluxo original
// ============================================================================
async function AbaPesquisar({ idAtual }: { idAtual?: string }) {
  const candidatas = await prisma.construtora.findMany({
    where: {
      leadStatus: { not: "perdido" },
      decisores: { none: { linkedinContatado: true } },
      AND: [{ decisores: { none: { confirmado: false } } }],
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

  const fila = candidatas
    .map((c) => ({ construtora: c, valorTotal: c.contratos.reduce((s, x) => s + (x.valorGlobal ?? 0), 0) }))
    .sort((a, b) => b.valorTotal - a.valorTotal);

  const atual = idAtual ? fila.find((f) => f.construtora.id === idAtual) ?? fila[0] : fila[0];

  if (!atual) {
    return (
      <div className="bg-white border rounded-lg p-12 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-lg font-semibold mb-1">Fila vazia!</h2>
        <p className="text-sm text-slate-600">
          Todas as construtoras já foram pesquisadas. Veja a aba <strong>A confirmar</strong> pra fechar os pendentes.
        </p>
      </div>
    );
  }

  const { construtora: c, valorTotal } = atual;
  const indice = fila.findIndex((f) => f.construtora.id === c.id);
  const proxima = fila[indice + 1];
  const agora = new Date();
  const ativos = c.contratos.filter((ct) => !ct.vigenciaFim || ct.vigenciaFim >= agora);
  const principal = (ativos[0] ?? c.contratos[0]) ?? null;
  const qsa: Array<{ nome_socio?: string; qualificacao_socio?: string }> = c.qsa ? JSON.parse(c.qsa) : [];

  return (
    <>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Construtora {indice + 1} de {fila.length} · ordenadas por valor descendente</span>
        {proxima && (
          <Link href={`/prospeccao?tab=pesquisar&id=${proxima.construtora.id}`} className="hover:underline">
            Pular →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <aside className="space-y-3">
          <div className="bg-white border rounded-lg p-4">
            <Link href={`/construtoras/${c.id}`} className="text-xs text-brand-600 hover:underline">
              Abrir página completa →
            </Link>
            <h2 className="font-bold mt-1 leading-tight">{c.razaoSocial}</h2>
            <div className="text-xs text-slate-500 font-mono mt-1">{c.cnpj}</div>
            <div className="text-xs text-slate-500 mt-1">{c.cidade ? `${c.cidade}/${c.uf}` : c.uf}</div>
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
              {principal.valorGlobal && <div className="font-mono mt-1">{formatBRL(principal.valorGlobal)}</div>}
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
        </aside>

        <div className="space-y-4">
          <LinkedInSearchPanel empresa={c.razaoSocial} />

          <section className="bg-white border rounded-lg p-5 space-y-3">
            <h3 className="font-semibold">Adicionar decisor encontrado</h3>
            <p className="text-xs text-slate-500">
              Achou alguém? Adicione com nome + URL. Vai pra aba <strong>A confirmar</strong> pra você revisar depois.
            </p>
            <AdicionarDecisorBtn construtoraId={c.id} />
          </section>

          <section className="bg-white border rounded-lg p-4 space-y-3">
            <div>
              <div className="font-medium text-sm">Não achou ninguém útil?</div>
              <div className="text-xs text-slate-500">
                Escolha o motivo: <strong>trabalhada</strong> (volta depois) ou <strong>sem perfil/perdida</strong> (descarta de vez).
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <MarcarTrabalhadaBtn construtoraId={c.id} proximaId={proxima?.construtora.id} />
              <MarcarPerdidoBtn
                construtoraId={c.id}
                proximaId={proxima?.construtora.id}
                tab="pesquisar"
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Aba "A confirmar" — revisar decisores pendentes
// ============================================================================
async function AbaConfirmar({ idAtual }: { idAtual?: string }) {
  const candidatas = await prisma.construtora.findMany({
    where: {
      leadStatus: { not: "perdido" },
      decisores: { some: { confirmado: false } },
    },
    include: {
      contratos: { select: { valorGlobal: true, vigenciaFim: true } },
      decisores: {
        where: { confirmado: false },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const fila = candidatas
    .map((c) => ({ construtora: c, valorTotal: c.contratos.reduce((s, x) => s + (x.valorGlobal ?? 0), 0) }))
    .sort((a, b) => b.valorTotal - a.valorTotal);

  const atual = idAtual ? fila.find((f) => f.construtora.id === idAtual) ?? fila[0] : fila[0];

  if (!atual) {
    return (
      <div className="bg-white border rounded-lg p-12 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-lg font-semibold mb-1">Nada a confirmar!</h2>
        <p className="text-sm text-slate-600">
          Todos os decisores adicionados já foram confirmados ou descartados.
        </p>
      </div>
    );
  }

  const { construtora: c, valorTotal } = atual;
  const indice = fila.findIndex((f) => f.construtora.id === c.id);
  const proxima = fila[indice + 1];

  return (
    <>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Construtora {indice + 1} de {fila.length} · ordenadas por valor descendente</span>
        {proxima && (
          <Link href={`/prospeccao?tab=confirmar&id=${proxima.construtora.id}`} className="hover:underline">
            Próxima →
          </Link>
        )}
      </div>

      <div className="bg-white border rounded-lg p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/construtoras/${c.id}`} className="text-xs text-brand-600 hover:underline">
              Abrir página completa →
            </Link>
            <h2 className="font-bold text-lg leading-tight">{c.razaoSocial}</h2>
            <div className="text-xs text-slate-500">
              {c.cidade ? `${c.cidade}/${c.uf}` : c.uf} · {formatBRL(valorTotal)} em contratos
            </div>
          </div>
          <MarcarPerdidoBtn
            construtoraId={c.id}
            proximaId={proxima?.construtora.id}
            tab="confirmar"
            variant="compact"
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-3">
            {c.decisores.length} {c.decisores.length === 1 ? "decisor pendente" : "decisores pendentes"} de confirmação:
          </h3>
          <ul className="divide-y">
            {c.decisores.map((d) => (
              <li key={d.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{d.nome}</div>
                    {d.cargo && <div className="text-xs text-slate-500">{d.cargo}</div>}
                    {d.linkedin && (
                      <a
                        href={d.linkedin.startsWith("http") ? d.linkedin : `https://${d.linkedin}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand-600 hover:underline break-all mt-1 inline-block"
                      >
                        🔗 {d.linkedin}
                      </a>
                    )}
                    {d.tier && (
                      <span className="ml-2 inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        Tier {d.tier}
                      </span>
                    )}
                  </div>
                  <ConfirmarDescartarBtns decisorId={d.id} nome={d.nome} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900">
          <strong>Dica:</strong> Abra o link do LinkedIn → confira foto, cargo atual, empresa atual.
          Se bater com a construtora ↑, clica <span className="font-medium">✓ Confirmar</span>. Senão, <span className="font-medium">✗ Descartar</span>.
        </div>
      </div>
    </>
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
