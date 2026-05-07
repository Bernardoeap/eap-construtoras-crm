// Backfill de um contrato chamando a API de detalhe do PNCP.
// URL: https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj_orgao}/contratos/{ano}/{seq}
// Extrai cnpj/ano/seq do campo numeroControlePNCP, formato:
//   {cnpj14}-{tipo}-{seq}/{ano4}   ex.: 83845701000159-2-000005/2026

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface PNCPDetail {
  valorGlobal?: number;
  valorInicial?: number;
  valorAcumulado?: number;
  dataVigenciaInicio?: string;
  dataVigenciaFim?: string;
  dataAssinatura?: string;
  modalidadeNome?: string;
  numeroContratoEmpenho?: string;
  objetoContrato?: string;
  orgaoEntidade?: { razaoSocial?: string };
  unidadeOrgao?: { ufSigla?: string; municipioNome?: string; nomeUnidade?: string };
}

function parseNumeroControle(s: string): { cnpj: string; ano: string; seq: number } | null {
  const m = /^(\d{14})-(\d+)-(\d+)\/(\d{4})$/.exec(s);
  if (!m) return null;
  return { cnpj: m[1], ano: m[4], seq: parseInt(m[3], 10) };
}

async function fetchDetail(cnpj: string, ano: string, seq: number): Promise<PNCPDetail | null> {
  const url = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpj}/contratos/${ano}/${seq}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    return (await r.json()) as PNCPDetail;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function toDate(s: string | undefined | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const c = await prisma.contrato.findUnique({ where: { id } });
  if (!c) return NextResponse.json({ ok: false, erro: "contrato não encontrado" }, { status: 404 });

  const parsed = parseNumeroControle(c.numeroControlePNCP);
  if (!parsed) {
    return NextResponse.json({ ok: false, erro: `numeroControlePNCP não parseável: ${c.numeroControlePNCP}` });
  }

  const detail = await fetchDetail(parsed.cnpj, parsed.ano, parsed.seq);
  if (!detail) {
    return NextResponse.json({ ok: false, erro: "PNCP não retornou detalhe (404 ou timeout)" });
  }

  const valor = detail.valorGlobal ?? detail.valorInicial ?? detail.valorAcumulado ?? null;
  const vIni = toDate(detail.dataVigenciaInicio);
  const vFim = toDate(detail.dataVigenciaFim);

  await prisma.contrato.update({
    where: { id },
    data: {
      valorGlobal: c.valorGlobal ?? valor,
      vigenciaInicio: c.vigenciaInicio ?? vIni,
      vigenciaFim: c.vigenciaFim ?? vFim,
      modalidade: c.modalidade ?? detail.modalidadeNome ?? null,
      numeroContrato: c.numeroContrato ?? detail.numeroContratoEmpenho ?? null,
      orgaoContratante: c.orgaoContratante ?? detail.orgaoEntidade?.razaoSocial ?? null,
      municipio: c.municipio ?? detail.unidadeOrgao?.municipioNome ?? null,
      uf: c.uf ?? detail.unidadeOrgao?.ufSigla ?? null,
    },
  });

  return NextResponse.json({ ok: true, valor, vIni, vFim });
}
