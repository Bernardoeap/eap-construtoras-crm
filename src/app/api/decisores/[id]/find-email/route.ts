import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findEmail } from "@/lib/hunter";
import { findEmailSnov } from "@/lib/snov";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decisor = await prisma.decisor.findUnique({
    where: { id },
    include: { construtora: { select: { site: true, razaoSocial: true } } },
  });

  if (!decisor) return NextResponse.json({ error: "Decisor não encontrado" }, { status: 404 });

  const { site, razaoSocial } = decisor.construtora;
  const opts = { nome: decisor.nome, site, razaoSocial };

  // 1. Hunter.io
  const hunterKey = process.env.HUNTER_API_KEY;
  if (hunterKey) {
    const r = await findEmail({ ...opts, apiKey: hunterKey });
    if (r) {
      await prisma.decisor.update({ where: { id }, data: { email: r.email } });
      return NextResponse.json({ found: true, email: r.email, score: r.score, fonte: "Hunter.io" });
    }
  }

  // 2. Snov.io
  const snovId = process.env.SNOV_CLIENT_ID;
  const snovSecret = process.env.SNOV_CLIENT_SECRET;
  if (snovId && snovSecret) {
    const r = await findEmailSnov({ ...opts, clientId: snovId, clientSecret: snovSecret });
    if (r) {
      await prisma.decisor.update({ where: { id }, data: { email: r.email } });
      return NextResponse.json({ found: true, email: r.email, score: r.score, fonte: "Snov.io" });
    }
  }

  return NextResponse.json({ found: false });
}
