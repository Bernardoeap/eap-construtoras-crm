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

export async function criarDecisor(
  construtoraId: string,
  data: {
    nome: string;
    cargo?: string;
    tier?: string;
    linkedin?: string;
    telefone?: string;
    email?: string;
  }
) {
  const nome = data.nome.trim();
  if (!nome) throw new Error("Nome obrigatório");

  await prisma.decisor.create({
    data: {
      construtoraId,
      nome,
      cargo: data.cargo?.trim() || null,
      tier: data.tier?.trim() || null,
      linkedin: data.linkedin?.trim() || null,
      telefone: data.telefone?.trim() || null,
      email: data.email?.trim() || null,
      fonte: "manual",
      confirmado: false, // Pendente até usuario confirmar
    },
  });

  revalidatePath(`/construtoras/${construtoraId}`);
  revalidatePath("/construtoras");
  revalidatePath("/prospeccao");
}

export async function confirmarDecisor(decisorId: string) {
  const d = await prisma.decisor.findUnique({
    where: { id: decisorId },
    select: { construtoraId: true },
  });
  await prisma.decisor.update({ where: { id: decisorId }, data: { confirmado: true } });
  if (d) {
    revalidatePath(`/construtoras/${d.construtoraId}`);
    revalidatePath("/prospeccao");
  }
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
