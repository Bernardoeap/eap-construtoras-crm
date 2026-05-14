"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { STATUS_ORDEM } from "@/lib/classify";

export async function updateStatus(construtoraId: string, status: string) {
  if (!STATUS_ORDEM.includes(status as (typeof STATUS_ORDEM)[number])) {
    throw new Error(`Status inválido: ${status}`);
  }
  await prisma.construtora.update({
    where: { id: construtoraId },
    data: { leadStatus: status },
  });
  await prisma.interacao.create({
    data: {
      construtoraId,
      tipo: "nota",
      descricao: `Status alterado para "${status}"`,
    },
  });
  revalidatePath(`/construtoras/${construtoraId}`);
  revalidatePath("/construtoras");
  revalidatePath("/prospeccao");
  revalidatePath("/");
}

export async function addTag(construtoraId: string, tag: string) {
  if (!tag.trim()) return;
  const c = await prisma.construtora.findUnique({ where: { id: construtoraId } });
  if (!c) return;
  const tags: string[] = c.tags ? JSON.parse(c.tags) : [];
  if (!tags.includes(tag)) tags.push(tag);
  await prisma.construtora.update({ where: { id: construtoraId }, data: { tags: JSON.stringify(tags) } });
  revalidatePath(`/construtoras/${construtoraId}`);
}

export async function removeTag(construtoraId: string, tag: string) {
  const c = await prisma.construtora.findUnique({ where: { id: construtoraId } });
  if (!c?.tags) return;
  const tags: string[] = JSON.parse(c.tags).filter((t: string) => t !== tag);
  await prisma.construtora.update({
    where: { id: construtoraId },
    data: { tags: tags.length ? JSON.stringify(tags) : null },
  });
  revalidatePath(`/construtoras/${construtoraId}`);
}
