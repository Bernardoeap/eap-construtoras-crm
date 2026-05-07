import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichCNPJ } from "@/lib/brasilapi";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ cnpj: string }> }) {
  const { cnpj: raw } = await ctx.params;
  const cnpj = decodeURIComponent(raw);

  const construtora = await prisma.construtora.findUnique({ where: { cnpj } });
  if (!construtora) return NextResponse.json({ ok: false, erro: "Construtora não encontrada" }, { status: 404 });

  const data = await enrichCNPJ(cnpj);
  if (!data) return NextResponse.json({ ok: false, erro: "Sem retorno da BrasilAPI" }, { status: 502 });

  const telefones = [data.ddd_telefone_1, data.ddd_telefone_2].filter(Boolean).join(" / ");
  const cnaesSec = JSON.stringify(data.cnaes_secundarios ?? []);
  const qsa = JSON.stringify(data.qsa ?? []);
  const capital = typeof data.capital_social === "string" ? Number(data.capital_social) : data.capital_social;

  await prisma.construtora.update({
    where: { cnpj },
    data: {
      razaoSocial: data.razao_social || construtora.razaoSocial,
      nomeFantasia: data.nome_fantasia || construtora.nomeFantasia,
      uf: data.uf || construtora.uf,
      cidade: data.municipio || construtora.cidade,
      cnaePrincipal: data.cnae_fiscal ? String(data.cnae_fiscal) : construtora.cnaePrincipal,
      cnaesSecundarios: cnaesSec,
      capitalSocial: Number.isFinite(capital as number) ? (capital as number) : construtora.capitalSocial,
      qsa,
      email: data.email || construtora.email,
      telefone: telefones || construtora.telefone,
      fonteEnriquecimento: "brasilapi",
    },
  });

  return NextResponse.json({ ok: true });
}
