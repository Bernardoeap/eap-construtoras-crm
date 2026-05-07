import { prisma } from "@/lib/db";
import {
  PipelineFunnelChart,
  ReunioesLineChart,
  QualifVsLostChart,
  DistribuicaoPieChart,
  ValorBarChart,
} from "@/components/charts";
import { STATUS_LABEL, STATUS_ORDEM, TIPO_OBRA_LABEL } from "@/lib/classify";

export const dynamic = "force-dynamic";

function mesIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function RelatoriosPage() {
  const [statusCounts, reunioes, interacoes, contratos, construtoras] = await Promise.all([
    prisma.construtora.groupBy({ by: ["leadStatus"], _count: { _all: true } }),
    prisma.reuniao.findMany({ select: { dataHora: true, status: true } }),
    prisma.interacao.findMany({ select: { criadoEm: true, descricao: true } }),
    prisma.contrato.findMany({
      select: { tipoObra: true, uf: true, valorGlobal: true, construtora: { select: { id: true, razaoSocial: true } } },
    }),
    prisma.construtora.findMany({ select: { uf: true, leadStatus: true, updatedAt: true } }),
  ]);

  // Funil de pipeline
  const pipelineData = STATUS_ORDEM.map((s) => ({
    status: STATUS_LABEL[s],
    count: statusCounts.find((x) => x.leadStatus === s)?._count._all ?? 0,
  }));

  // Reuniões agendadas vs realizadas por mês (últimos 6 meses)
  const meses: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    meses.push(mesIso(d));
  }
  const reunioesAgg = meses.map((mes) => {
    const ag = reunioes.filter((r) => mesIso(new Date(r.dataHora)) === mes).length;
    const re = reunioes.filter((r) => mesIso(new Date(r.dataHora)) === mes && r.status === "realizada").length;
    return { mes, agendadas: ag, realizadas: re };
  });

  // Leads qualificados vs perdidos por mês (via interações de mudança de status)
  const qualifAgg = meses.map((mes) => {
    const inMes = interacoes.filter((i) => mesIso(new Date(i.criadoEm)) === mes);
    return {
      mes,
      qualificados: inMes.filter((i) => /qualificado/i.test(i.descricao)).length,
      perdidos: inMes.filter((i) => /perdido/i.test(i.descricao)).length,
    };
  });

  // Top 10 construtoras por valor
  const topMap = new Map<string, { name: string; valor: number }>();
  for (const c of contratos) {
    const k = c.construtora.id;
    const cur = topMap.get(k) ?? { name: c.construtora.razaoSocial, valor: 0 };
    cur.valor += c.valorGlobal ?? 0;
    topMap.set(k, cur);
  }
  const top10 = Array.from(topMap.values())
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  // Distribuição UF
  const ufMap = new Map<string, number>();
  for (const c of construtoras) ufMap.set(c.uf, (ufMap.get(c.uf) ?? 0) + 1);
  const ufData = Array.from(ufMap.entries()).map(([name, value]) => ({ name, value }));

  // Distribuição tipo obra
  const tipoMap = new Map<string, number>();
  for (const c of contratos) {
    const k = c.tipoObra ?? "outro";
    tipoMap.set(k, (tipoMap.get(k) ?? 0) + 1);
  }
  const tipoData = Array.from(tipoMap.entries()).map(([k, value]) => ({
    name: TIPO_OBRA_LABEL[k as keyof typeof TIPO_OBRA_LABEL] ?? k,
    value,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-sm text-slate-500">Pipeline, reuniões e distribuição da carteira.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Funil de pipeline">
          <PipelineFunnelChart data={pipelineData} />
        </ChartCard>
        <ChartCard title="Reuniões: marcadas × realizadas (6 meses)">
          <ReunioesLineChart data={reunioesAgg} />
        </ChartCard>
        <ChartCard title="Leads qualificados × perdidos (6 meses)">
          <QualifVsLostChart data={qualifAgg} />
        </ChartCard>
        <ChartCard title="Distribuição por UF">
          <DistribuicaoPieChart data={ufData} label="UF" />
        </ChartCard>
        <ChartCard title="Distribuição por tipo de obra">
          <DistribuicaoPieChart data={tipoData} label="Tipo" />
        </ChartCard>
        <ChartCard title="Top 10 construtoras por valor de contratos">
          <ValorBarChart data={top10} />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg p-5">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}
