import { prisma } from "@/lib/db";
import { TIPO_OBRA_LABEL } from "@/lib/classify";

export const dynamic = "force-dynamic";

function csvText(v: string | null | undefined): string {
  if (!v) return "";
  const s = v.replace(/"/g, '""');
  return `"${s}"`;
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
            select: { valorGlobal: true, vigenciaFim: true, tipoObra: true },
            orderBy: { valorGlobal: "desc" },
          },
        },
      },
    },
    orderBy: { construtora: { razaoSocial: "asc" } },
  });

  const header = ["nome_decisor", "empresa", "tipo_obra", "telefone"].join(";");
  const linhas: string[] = [header];

  for (const d of decisores) {
    const contratos = d.construtora.contratos;
    const ativos = contratos.filter((c) => !c.vigenciaFim || c.vigenciaFim >= agora);
    const principal = ativos[0] ?? contratos[0] ?? null;

    const tipoObra = principal?.tipoObra
      ? (TIPO_OBRA_LABEL[principal.tipoObra as keyof typeof TIPO_OBRA_LABEL] ?? principal.tipoObra)
      : "";

    // Telefone sempre entre aspas para Excel tratar como texto (evita notação científica)
    const telefone = d.telefone ? `"${d.telefone.replace(/"/g, '')}"` : "";

    linhas.push(
      [csvText(d.nome), csvText(d.construtora.razaoSocial), csvText(tipoObra), telefone].join(";")
    );
  }

  const csv = "﻿" + linhas.join("\r\n");
  const dataStr = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="decisores-3cplus-${dataStr}.csv"`,
    },
  });
}
