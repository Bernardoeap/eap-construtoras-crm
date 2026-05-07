"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function agendarReuniao(
  construtoraId: string,
  titulo: string,
  dataHora: string,
  notas?: string
) {
  const dt = new Date(dataHora);
  if (Number.isNaN(dt.getTime())) throw new Error("Data inválida");
  await prisma.reuniao.create({
    data: { construtoraId, titulo: titulo.trim() || "Reunião", dataHora: dt, status: "agendada", notas: notas || null },
  });
  await prisma.construtora.update({
    where: { id: construtoraId },
    data: { leadStatus: "reuniao_marcada" },
  });
  await prisma.interacao.create({
    data: { construtoraId, tipo: "reuniao", descricao: `Reunião agendada: ${titulo} em ${dt.toLocaleString("pt-BR")}` },
  });
  revalidatePath(`/construtoras/${construtoraId}`);
  revalidatePath("/relatorios");
  revalidatePath("/");
}

export async function marcarReuniaoStatus(reuniaoId: string, status: "realizada" | "cancelada" | "no-show") {
  const r = await prisma.reuniao.update({ where: { id: reuniaoId }, data: { status } });
  if (status === "realizada") {
    await prisma.construtora.update({
      where: { id: r.construtoraId },
      data: { leadStatus: "reuniao_realizada" },
    });
  }
  await prisma.interacao.create({
    data: { construtoraId: r.construtoraId, tipo: "reuniao", descricao: `Reunião marcada como ${status}` },
  });
  revalidatePath(`/construtoras/${r.construtoraId}`);
  revalidatePath("/relatorios");
}
