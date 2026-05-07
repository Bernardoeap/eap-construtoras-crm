// Triagem por OBJETO DOS CONTRATOS (rapida, sem chamadas externas).
// Logica: para cada construtora, olha todos os contratos dela.
// Se ao menos um contrato tem objeto de obra civil (construcao/reforma/etc),
// fica na carteira. Se nenhum, marca fora-do-icp.
// Tambem desfaz marcacoes anteriores (caso a regra tenha mudado).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { objetoEhObra } from "@/lib/classify";

function parseTags(s: string | null): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function stringifyTags(tags: string[]): string | null {
  return tags.length ? JSON.stringify(tags) : null;
}

export async function POST() {
  const log = await prisma.syncLog.create({
    data: { fonte: "triagem-objeto", status: "em_andamento" },
  });

  const construtoras = await prisma.construtora.findMany({
    include: { contratos: { select: { objeto: true } } },
  });

  let mantidas = 0;
  let foraIcp = 0;
  let semContratos = 0;
  let restauradas = 0;

  try {
    for (const c of construtoras) {
      const tags = parseTags(c.tags);
      const tinhaForaIcp = tags.includes("fora-do-icp");

      if (c.contratos.length === 0) {
        // sem contratos: nao toca em nada
        semContratos++;
        continue;
      }

      const temObra = c.contratos.some((ct) => objetoEhObra(ct.objeto));

      if (temObra) {
        mantidas++;
        // se estava marcada erroneamente como fora-do-icp, restaura
        if (tinhaForaIcp) {
          const novosTags = tags.filter((t) => t !== "fora-do-icp");
          await prisma.construtora.update({
            where: { id: c.id },
            data: {
              tags: stringifyTags(novosTags),
              // se status estava 'perdido' E veio da triagem automatica, volta pra novo
              leadStatus: c.leadStatus === "perdido" ? "novo" : c.leadStatus,
            },
          });
          restauradas++;
        }
      } else {
        foraIcp++;
        if (!tinhaForaIcp) {
          await prisma.construtora.update({
            where: { id: c.id },
            data: {
              tags: stringifyTags([...tags, "fora-do-icp"]),
              leadStatus: c.leadStatus === "novo" ? "perdido" : c.leadStatus,
            },
          });
        }
      }
    }

    const msg = `${mantidas} mantidas (têm obra) · ${foraIcp} fora do ICP (sem objeto de obra) · ${restauradas} restauradas · ${semContratos} sem contratos`;

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "ok",
        finalizadoEm: new Date(),
        registrosAtualizados: mantidas + foraIcp,
        mensagem: msg,
      },
    });

    return NextResponse.json({ ok: true, mantidas, foraIcp, semContratos, restauradas, mensagem: msg });
  } catch (e) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "erro", finalizadoEm: new Date(), mensagem: String(e) },
    });
    return NextResponse.json({ ok: false, erro: String(e) }, { status: 500 });
  }
}
