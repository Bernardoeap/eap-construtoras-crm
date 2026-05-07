import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const semEnriquecer = req.nextUrl.searchParams.get("semEnriquecer") === "1";

  const list = await prisma.construtora.findMany({
    where: {
      leadStatus: { not: "perdido" },
      // Quando semEnriquecer=1, retorna so quem ainda nao foi enriquecido
      // (sem QSA preenchido OU sem CNAE). Util pra re-tentar apenas as falhas.
      ...(semEnriquecer ? { OR: [{ qsa: null }, { cnaePrincipal: null }] } : {}),
    },
    select: { cnpj: true, razaoSocial: true },
    orderBy: { razaoSocial: "asc" },
  });
  return NextResponse.json(list);
}
