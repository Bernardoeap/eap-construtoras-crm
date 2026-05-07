"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateDecisorLinkedIn(decisorId: string, linkedin: string) {
  const trimmed = linkedin.trim();
  await prisma.decisor.update({
    where: { id: decisorId },
    data: { linkedin: trimmed.length > 0 ? trimmed : null },
  });
  const d = await prisma.decisor.findUnique({ where: { id: decisorId }, select: { construtoraId: true } });
  if (d) revalidatePath(`/construtoras/${d.construtoraId}`);
}

export async function updateDecisorContato(
  decisorId: string,
  field: "email" | "telefone" | "cargo",
  value: string
) {
  const trimmed = value.trim();
  await prisma.decisor.update({
    where: { id: decisorId },
    data: { [field]: trimmed.length > 0 ? trimmed : null },
  });
  const d = await prisma.decisor.findUnique({ where: { id: decisorId }, select: { construtoraId: true } });
  if (d) revalidatePath(`/construtoras/${d.construtoraId}`);
}

export async function deleteDecisor(decisorId: string) {
  const d = await prisma.decisor.findUnique({ where: { id: decisorId }, select: { construtoraId: true } });
  await prisma.decisor.delete({ where: { id: decisorId } });
  if (d) revalidatePath(`/construtoras/${d.construtoraId}`);
}

export async function toggleLinkedinContatado(decisorId: string) {
  const d = await prisma.decisor.findUnique({
    where: { id: decisorId },
    select: { construtoraId: true, linkedinContatado: true, nome: true },
  });
  if (!d) return;

  const novoStatus = !d.linkedinContatado;
  await prisma.decisor.update({
    where: { id: decisorId },
    data: {
      linkedinContatado: novoStatus,
      linkedinContatadoEm: novoStatus ? new Date() : null,
    },
  });

  if (novoStatus) {
    await prisma.interacao.create({
      data: {
        construtoraId: d.construtoraId,
        tipo: "linkedin",
        descricao: `Mensagem enviada no LinkedIn para ${d.nome}`,
      },
    });
  }

  revalidatePath(`/construtoras/${d.construtoraId}`);
  revalidatePath("/construtoras");
}
