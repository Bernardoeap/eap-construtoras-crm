import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const list = await prisma.contrato.findMany({
    where: {
      OR: [{ valorGlobal: null }, { vigenciaInicio: null }, { vigenciaFim: null }],
    },
    select: {
      id: true,
      numeroControlePNCP: true,
      construtora: { select: { razaoSocial: true } },
    },
    take: 5000,
  });
  return NextResponse.json(
    list.map((l) => ({ id: l.id, numero: l.numeroControlePNCP, empresa: l.construtora.razaoSocial }))
  );
}
