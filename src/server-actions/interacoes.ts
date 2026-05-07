"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addInteracao(construtoraId: string, tipo: string, descricao: string) {
  if (!descricao.trim()) return;
  await prisma.interacao.create({ data: { construtoraId, tipo, descricao } });
  revalidatePath(`/construtoras/${construtoraId}`);
}
