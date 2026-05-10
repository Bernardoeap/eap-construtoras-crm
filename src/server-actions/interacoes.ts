"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addInteracao(construtoraId: string, tipo: string, descricao: string) {
  if (!descricao.trim()) return;
  await prisma.interacao.create({ data: { construtoraId, tipo, descricao } });
  revalidatePath(`/construtoras/${construtoraId}`);
}

export async function marcarProspeccaoTrabalhada(construtoraId: string) {
  await prisma.interacao.create({
    data: {
      construtoraId,
      tipo: "prospeccao_linkedin",
      descricao: "Sessão de pesquisa LinkedIn — sem perfil encontrado / pulado",
    },
  });
  revalidatePath("/prospeccao");
  revalidatePath(`/construtoras/${construtoraId}`);
}
