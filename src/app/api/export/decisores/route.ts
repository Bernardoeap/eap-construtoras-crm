import { prisma } from "@/lib/db";
import { TIPO_OBRA_LABEL } from "@/lib/classify";

export const dynamic = "force-dynamic";

function csvEscape(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const agora = new Date();

  const decisores = await prisma.decisor.findMany({
    where: {
      telefone: { not: null },
      construtora: { leadStatus: { not: "perdido" } },
    },
    include: {
      construtora: {
        include: {
          contratos: {
            select: {
              valorGlobal: true,
              vigenciaFim: true,
              objeto: true,
              orgaoContratante: true,
              municipio: true,
              tipoObra: true,
            },
            orderBy: { valorGlobal: "desc" },
          },
        },
      },
    },
    orderBy: { construtora: { razaoSocial: "asc" } },
  });

  const header = [
    "nome_decisor",
    "empresa",
    "tipo_obra",
    "telefone",
    "cargo",
    "email",
    "linkedin",
    "cnpj",
    "uf",
    "valor_total_contratos_mi",
    "qtd_contratos_ativos",
    "qtd_contratos_total",
    "objeto_principal",
    "orgao_principal",
    "municipio_principal",
    "valor_maior_contrato_mi",
  ];

  const linhas: string[] = [header.join(";")];

  for (const d of decisores) {
    const contratos = d.construtora.contratos;
    const totalValor = contratos.reduce((s, c) => s + (c.valorGlobal ?? 0), 0);
    const ativos = contratos.filter((c) => !c.vigenciaFim || c.vigenciaFim >= agora);
    const valorMi = (totalValor / 1_000_000).toFixed(2).replace(".", ",");

    const principal = ativos[0] ?? contratos[0] ?? null;
    const tipoObraLabel = principal?.tipoObra
      ? (TIPO_OBRA_LABEL[principal.tipoObra as keyof typeof TIPO_OBRA_LABEL] ?? principal.tipoObra)
      : "";
    const objetoPrincipal = principal?.objeto?.replace(/\s+/g, " ").trim().slice(0, 500) ?? "";
    const orgaoPrincipal = principal?.orgaoContratante ?? "";
    const municipioPrincipal = principal?.municipio ?? "";
    const valorMaiorMi = principal?.valorGlobal
      ? (principal.valorGlobal / 1_000_000).toFixed(2).replace(".", ",")
      : "";

    linhas.push(
      [
        csvEscape(d.nome),
        csvEscape(d.construtora.razaoSocial),
        csvEscape(tipoObraLabel),
        csvEscape(d.telefone),
        csvEscape(d.cargo),
        csvEscape(d.email),
        csvEscape(d.linkedin),
        csvEscape(d.construtora.cnpj),
        csvEscape(d.construtora.uf),
        csvEscape(valorMi),
        csvEscape(ativos.length),
        csvEscape(contratos.length),
        csvEscape(objetoPrincipal),
        csvEscape(orgaoPrincipal),
        csvEscape(municipioPrincipal),
        csvEscape(valorMaiorMi),
      ].join(";")
    );
  }

  const csv = "﻿" + linhas.join("\r\n"); // BOM p/ Excel abrir UTF-8 corretamente

  const dataStr = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="decisores-3cplus-${dataStr}.csv"`,
    },
  });
}
