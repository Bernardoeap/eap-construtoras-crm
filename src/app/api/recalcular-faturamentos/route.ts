// Recalcula faturamentoEstimado + faixaFaturamento de TODAS as construtoras,
// usando os dados que ja temos no banco (capital social + contratos PNCP),
// sem chamar a Receita. Quem ja tinha porte salvo via enrich anterior, melhor;
// quem nao tinha, usa so contratos + capital.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { estimarFaturamento } from "@/lib/classify";

export const maxDuration = 120;

export async function POST() {
  const desde24m = new Date();
  desde24m.setMonth(desde24m.getMonth() - 24);

  const construtoras = await prisma.construtora.findMany({
    select: { id: true, capitalSocial: true },
  });

  let processadas = 0;
  let comFaturamento = 0;

  for (const c of construtoras) {
    const agg = await prisma.contrato.aggregate({
      where: {
        construtoraId: c.id,
        OR: [{ vigenciaInicio: { gte: desde24m } }, { vigenciaInicio: null }],
      },
      _sum: { valorGlobal: true },
    });
    const soma = agg._sum.valorGlobal ?? 0;

    const { valor, faixa } = estimarFaturamento({
      porte: null, // nao temos persistido; sera refinado quando usuario clicar enrich
      somaContratos24m: soma,
      capitalSocial: c.capitalSocial,
    });

    await prisma.construtora.update({
      where: { id: c.id },
      data: { faturamentoEstimado: valor, faixaFaturamento: faixa },
    });

    processadas++;
    if (valor !== null) comFaturamento++;
  }

  return NextResponse.json({
    ok: true,
    processadas,
    comFaturamento,
    mensagem: `${processadas} construtoras processadas · ${comFaturamento} com faturamento estimado`,
  });
}
