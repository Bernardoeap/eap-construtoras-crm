import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichCNPJ } from "@/lib/brasilapi";
import { estimarFaturamento } from "@/lib/classify";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ cnpj: string }> }) {
  const { cnpj: raw } = await ctx.params;
  const cnpj = decodeURIComponent(raw);

  const construtora = await prisma.construtora.findUnique({ where: { cnpj } });
  if (!construtora) return NextResponse.json({ ok: false, erro: "Construtora não encontrada" }, { status: 404 });

  const { data, fonte } = await enrichCNPJ(cnpj);
  if (!data) return NextResponse.json({ ok: false, erro: `Sem retorno (${fonte})` }, { status: 502 });

  const telefones = [data.ddd_telefone_1, data.ddd_telefone_2].filter(Boolean).join(" / ");
  const cnaesSec = JSON.stringify(data.cnaes_secundarios ?? []);
  const qsa = JSON.stringify(data.qsa ?? []);
  const capital = typeof data.capital_social === "string" ? Number(data.capital_social) : data.capital_social;
  const capitalNum = Number.isFinite(capital as number) ? (capital as number) : construtora.capitalSocial;

  // Soma dos contratos PNCP nos ultimos 24 meses (proxy de receita publica anual)
  const desde24m = new Date();
  desde24m.setMonth(desde24m.getMonth() - 24);
  const aggContratos = await prisma.contrato.aggregate({
    where: {
      construtoraId: construtora.id,
      OR: [{ vigenciaInicio: { gte: desde24m } }, { vigenciaInicio: null }],
    },
    _sum: { valorGlobal: true },
  });
  const somaContratos24m = aggContratos._sum.valorGlobal ?? 0;

  const { valor: faturamentoEstimado, faixa: faixaFaturamento } = estimarFaturamento({
    porte: data.descricao_porte ?? null,
    somaContratos24m,
    capitalSocial: capitalNum,
  });

  await prisma.construtora.update({
    where: { cnpj },
    data: {
      razaoSocial: data.razao_social || construtora.razaoSocial,
      nomeFantasia: data.nome_fantasia || construtora.nomeFantasia,
      uf: data.uf || construtora.uf,
      cidade: data.municipio || construtora.cidade,
      cnaePrincipal: data.cnae_fiscal ? String(data.cnae_fiscal) : construtora.cnaePrincipal,
      cnaesSecundarios: cnaesSec,
      capitalSocial: capitalNum,
      faturamentoEstimado,
      faixaFaturamento,
      qsa,
      email: data.email || construtora.email,
      telefone: telefones || construtora.telefone,
      fonteEnriquecimento: fonte,
    },
  });

  // Cria Decisor para cada socio do QSA (Receita Federal), sem duplicar
  let decisoresCriados = 0;
  if (data.qsa && data.qsa.length > 0) {
    for (const socio of data.qsa) {
      const nome = socio.nome_socio?.trim();
      if (!nome) continue;

      const ja = await prisma.decisor.findFirst({
        where: { construtoraId: construtora.id, nome },
      });
      if (ja) continue;

      const cargo = socio.qualificacao_socio ?? "Sócio";
      const senioridade = /administrador|diretor|presidente/i.test(cargo) ? "c-suite" : "socio";

      await prisma.decisor.create({
        data: {
          construtoraId: construtora.id,
          nome,
          cargo,
          senioridade,
          fonte: "receita-federal",
        },
      });
      decisoresCriados++;
    }
  }

  return NextResponse.json({ ok: true, decisoresCriados });
}
