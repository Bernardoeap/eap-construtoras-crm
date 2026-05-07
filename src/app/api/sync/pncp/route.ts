import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { fetchContratos, formatCNPJ, pncpDateToISO } from "@/lib/pncp";
import { classificarTipoObra, pareceConstrutora } from "@/lib/classify";

const Body = z.object({
  ufs: z.array(z.string().length(2)).min(1),
  diasAtras: z.number().int().min(1).max(365).default(30),
  valorMin: z.number().nonnegative().default(2_000_000),
  valorMax: z.number().nonnegative().default(50_000_000),
  paginasMax: z.number().int().min(1).max(50).default(20),
  palavrasChave: z.array(z.string()).optional(),
});

const KEYWORDS_PADRAO = [
  "rodovia", "asfalto", "pavimenta", "recapeamento", "estrada",
  "ponte", "viaduto",
  "água", "esgoto", "saneamento", "adutora", "drenagem", "ete", "eta",
  "hospital", "upa", "ubs", "unidade básica", "unidade de pronto",
  "escola", "emef", "cei", "ceu", "creche",
  "edificação", "obra", "engenharia",
];

function ymd(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ ok: false, erro: "Payload inválido", detalhe: String(e) }, { status: 400 });
  }

  const dataFinal = ymd(new Date());
  const dataInicial = ymd(new Date(Date.now() - body.diasAtras * 24 * 60 * 60 * 1000));
  const keywords = (body.palavrasChave?.length ? body.palavrasChave : KEYWORDS_PADRAO).map((k) => k.toLowerCase());

  const log = await prisma.syncLog.create({
    data: {
      fonte: "pncp",
      status: "em_andamento",
      mensagem: `UFs ${body.ufs.join(",")} | ${dataInicial}–${dataFinal} | R$${body.valorMin}–${body.valorMax}`,
    },
  });

  let novos = 0;
  let atualizados = 0;
  let mensagem = "";

  try {
    const contratos = await fetchContratos({
      ufs: body.ufs,
      dataInicial,
      dataFinal,
      valorMin: body.valorMin,
      valorMax: body.valorMax,
      paginasMax: body.paginasMax,
      delayMs: 700,
    });

    for (const item of contratos) {
      const objeto = (item.objetoContrato ?? "").toLowerCase();
      if (!keywords.some((k) => objeto.includes(k))) continue;

      const cnpj = formatCNPJ(item.niFornecedor);
      const razao = item.nomeRazaoSocialFornecedor?.trim() ?? "";
      const numeroControle = item.numeroControlePNCP;
      if (!cnpj || !razao || !numeroControle) continue;

      const uf = item.unidadeOrgao?.ufSigla ?? "";
      const ehConstrutora = pareceConstrutora(razao, null);

      let construtora = await prisma.construtora.findUnique({ where: { cnpj } });
      if (!construtora) {
        construtora = await prisma.construtora.create({
          data: {
            cnpj,
            razaoSocial: razao,
            uf,
            cidade: item.unidadeOrgao?.municipioNome ?? null,
            tags: ehConstrutora ? null : JSON.stringify(["revisar"]),
            fonteEnriquecimento: "pncp-sync",
          },
        });
      }

      const exists = await prisma.contrato.findUnique({ where: { numeroControlePNCP: numeroControle } });
      if (exists) {
        atualizados++;
        continue;
      }

      await prisma.contrato.create({
        data: {
          construtoraId: construtora.id,
          numeroControlePNCP: numeroControle,
          numeroContrato: item.numeroContratoEmpenho ?? null,
          objeto: item.objetoContrato ?? "",
          valorGlobal: item.valorGlobal ?? null,
          orgaoContratante: item.orgaoEntidade?.razaoSocial ?? item.unidadeOrgao?.nomeUnidade ?? null,
          uf,
          municipio: item.unidadeOrgao?.municipioNome ?? null,
          modalidade: item.modalidadeNome ?? null,
          vigenciaInicio: pncpDateToISO(item.dataVigenciaInicio),
          vigenciaFim: pncpDateToISO(item.dataVigenciaFim),
          linkPncp: numeroControle ? `https://pncp.gov.br/app/contratos/${numeroControle}` : null,
          tipoObra: classificarTipoObra(item.objetoContrato ?? ""),
        },
      });
      novos++;
    }

    mensagem = `OK · ${contratos.length} retornados pela API · ${novos} novos · ${atualizados} já existentes`;
  } catch (e) {
    mensagem = `ERRO: ${String(e)}`;
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "erro", finalizadoEm: new Date(), mensagem, registrosNovos: novos, registrosAtualizados: atualizados },
    });
    return NextResponse.json({ ok: false, erro: mensagem }, { status: 500 });
  }

  await prisma.syncLog.update({
    where: { id: log.id },
    data: { status: "ok", finalizadoEm: new Date(), mensagem, registrosNovos: novos, registrosAtualizados: atualizados },
  });

  return NextResponse.json({ ok: true, novos, atualizados, mensagem });
}
