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
