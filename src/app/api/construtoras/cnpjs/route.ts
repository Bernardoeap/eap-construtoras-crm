import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const list = await prisma.construtora.findMany({
    where: { leadStatus: { not: "perdido" } },
    select: { cnpj: true, razaoSocial: true },
    orderBy: { razaoSocial: "asc" },
  });
  return NextResponse.json(list);
}
