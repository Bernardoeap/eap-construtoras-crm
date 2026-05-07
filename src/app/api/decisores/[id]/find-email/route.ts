import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findEmail } from "@/lib/hunter";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "HUNTER_API_KEY não configurada" }, { status: 503 });
  }

  const { id } = await params;
  const decisor = await prisma.decisor.findUnique({
    where: { id },
    include: { construtora: { select: { site: true, razaoSocial: true } } },
  });

  if (!decisor) return NextResponse.json({ error: "Decisor não encontrado" }, { status: 404 });

  const result = await findEmail({
    nome: decisor.nome,
    site: decisor.construtora.site,
    razaoSocial: decisor.construtora.razaoSocial,
    apiKey,
  });

  if (!result) {
    return NextResponse.json({ found: false });
  }

  await prisma.decisor.update({
    where: { id },
    data: { email: result.email },
  });

  return NextResponse.json({ found: true, email: result.email, score: result.score });
}
