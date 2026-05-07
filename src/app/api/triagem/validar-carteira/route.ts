import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichCNPJ } from "@/lib/brasilapi";
import { cnaeEhConstrucao } from "@/lib/classify";

export const maxDuration = 300; // ate 5 min em runtime Vercel

function addTag(existing: string | null, tag: string): string {
  const tags: string[] = existing ? JSON.parse(existing) : [];
  if (!tags.includes(tag)) tags.push(tag);
  return JSON.stringify(tags);
}

function removeTag(existing: string | null, tag: string): string | null {
  if (!existing) return null;
  const tags: string[] = JSON.parse(existing).filter((t: string) => t !== tag);
  return tags.length ? JSON.stringify(tags) : null;
}

export async function POST() {
  const log = await prisma.syncLog.create({
    data: { fonte: "triagem-receita", status: "em_andamento" },
  });

  const construtoras = await prisma.construtora.findMany({
    select: { id: true, cnpj: true, cnaePrincipal: true, tags: true, leadStatus: true },
  });

  let processadas = 0;
  let construcao = 0;
  let foraIcp = 0;
  let semRetorno = 0;

  try {
    for (const c of construtoras) {
      let cnae = c.cnaePrincipal;

      // Se ja tem CNAE salvo, nao precisa chamar API
      if (!cnae) {
        const { data } = await enrichCNPJ(c.cnpj);
        if (data?.cnae_fiscal) {
          cnae = String(data.cnae_fiscal);
          await prisma.construtora.update({
            where: { id: c.id },
            data: {
              cnaePrincipal: cnae,
              razaoSocial: data.razao_social || undefined,
              nomeFantasia: data.nome_fantasia || undefined,
              email: data.email || undefined,
            },
          });
        } else {
          semRetorno++;
        }
        // delay anti-rate-limit
        await new Promise((r) => setTimeout(r, 500));
      }

      processadas++;

      if (cnaeEhConstrucao(cnae)) {
        construcao++;
        // remove tag fora-do-icp se ja tinha (caso tenha mudado de classificacao)
        const newTags = removeTag(c.tags, "fora-do-icp");
        if (newTags !== c.tags) {
          await prisma.construtora.update({ where: { id: c.id }, data: { tags: newTags } });
        }
      } else if (cnae) {
        foraIcp++;
        await prisma.construtora.update({
          where: { id: c.id },
          data: {
            tags: addTag(c.tags, "fora-do-icp"),
            // so muda status se ainda esta como "novo" (nao sobrescreve trabalho do usuario)
            leadStatus: c.leadStatus === "novo" ? "perdido" : c.leadStatus,
          },
        });
      }
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "ok",
        finalizadoEm: new Date(),
        registrosNovos: 0,
        registrosAtualizados: processadas,
        mensagem: `${processadas} processadas · ${construcao} construção · ${foraIcp} fora ICP · ${semRetorno} sem retorno`,
      },
    });

    return NextResponse.json({ ok: true, processadas, construcao, foraIcp, semRetorno });
  } catch (e) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "erro", finalizadoEm: new Date(), mensagem: String(e) },
    });
    return NextResponse.json({ ok: false, erro: String(e) }, { status: 500 });
  }
}
