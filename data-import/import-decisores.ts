// Importa decisores_batch1.csv (gerado pelo Vibe Prospecting).
// Vínculo: business_input.name → razão social da Construtora (match por substring sem acentos).
// Filtra linhas com profile_country_name != "brazil" (descarta noise tipo Lam Research).

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { parseCSV } from "../src/lib/csv";

const CSV_PATHS = [
  path.join(process.cwd(), "data-import", "decisores_batch1.csv"),
  "C:\\Users\\berna\\iCloudDrive\\Documents\\EAP\\decisores_batch1.csv",
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const A = normalize(a);
  const B = normalize(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  if (A.includes(B) || B.includes(A)) return 0.85;
  const tokensA = new Set(A.split(" "));
  const tokensB = new Set(B.split(" "));
  const inter = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return inter / union;
}

export async function importDecisores(prisma: PrismaClient): Promise<{ decisores: number; descartados: number }> {
  const csvPath = CSV_PATHS.find((p) => fs.existsSync(p));
  if (!csvPath) {
    console.warn("[import-decisores] CSV não encontrado em nenhum dos paths:", CSV_PATHS);
    return { decisores: 0, descartados: 0 };
  }
  console.log(`[import-decisores] lendo ${csvPath}`);

  const text = fs.readFileSync(csvPath, "utf8");
  const rows = parseCSV(text, ",");
  console.log(`[import-decisores] ${rows.length} linhas no CSV`);

  const construtoras = await prisma.construtora.findMany({ select: { id: true, razaoSocial: true, cnpj: true } });

  let inseridos = 0;
  let descartados = 0;

  for (const r of rows) {
    const country = (r["profile_country_name"] || "").trim().toLowerCase();
    if (country && country !== "brazil") {
      descartados++;
      continue;
    }

    const nome = (r["prospect_full_name"] || "").trim();
    if (!nome) {
      descartados++;
      continue;
    }

    let razaoTarget = "";
    try {
      const bi = JSON.parse(r["business_input"] || "{}");
      razaoTarget = bi?.name || "";
    } catch {
      razaoTarget = "";
    }

    if (!razaoTarget) {
      descartados++;
      continue;
    }

    let best: { id: string; score: number } | null = null;
    for (const c of construtoras) {
      const s = similarity(razaoTarget, c.razaoSocial);
      if (!best || s > best.score) best = { id: c.id, score: s };
    }
    if (!best || best.score < 0.5) {
      descartados++;
      continue;
    }

    await prisma.decisor.create({
      data: {
        construtoraId: best.id,
        nome,
        cargo: r["prospect_job_title"] || null,
        email: r["contact_professions_email"] || r["contact_emails"] || null,
        telefone: r["contact_mobile_phone"] || null,
        linkedin: r["prospect_linkedin"] || null,
        departamento: r["profile_job_department_main"] || null,
        senioridade: r["profile_job_level_main"] || null,
        fonte: "vibe-prospecting",
      },
    });
    inseridos++;
  }

  return { decisores: inseridos, descartados };
}
