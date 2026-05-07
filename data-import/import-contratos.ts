// Importa contratos_ba_sp_sc.csv (gerado pelo seu scraper PNCP).
// Cabeçalhos esperados (separador `;`):
//   numero_contrato; numero_controle_pncp; empresa_contratada; cnpj_contratada;
//   objeto; orgao_contratante; municipio; uf; modalidade; link_pncp
// Idempotente: contratos com numero_controle_pncp já existente são pulados.

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { parseCSV, parseValorBR } from "../src/lib/csv";
import { classificarTipoObra, pareceConstrutora } from "../src/lib/classify";

const CSV_PATHS = [
  // ordem de preferência: copiado para o repo, depois path absoluto original
  path.join(process.cwd(), "data-import", "contratos_ba_sp_sc.csv"),
  "C:\\Users\\berna\\iCloudDrive\\Documents\\EAP\\contratos_ba_sp_sc.csv",
];

export async function importContratos(prisma: PrismaClient): Promise<{ contratos: number; construtoras: number }> {
  const csvPath = CSV_PATHS.find((p) => fs.existsSync(p));
  if (!csvPath) {
    console.warn("[import-contratos] CSV não encontrado em nenhum dos paths:", CSV_PATHS);
    return { contratos: 0, construtoras: 0 };
  }
  console.log(`[import-contratos] lendo ${csvPath}`);

  const text = fs.readFileSync(csvPath, "utf8");
  const rows = parseCSV(text, ";");
  console.log(`[import-contratos] ${rows.length} linhas no CSV`);

  let novosContratos = 0;
  const cnpjsVistos = new Set<string>();

  for (const r of rows) {
    const cnpj = (r["cnpj_contratada"] || "").trim();
    const razao = (r["empresa_contratada"] || "").trim();
    const numeroControle = (r["numero_controle_pncp"] || "").trim();
    const uf = (r["uf"] || "").trim().toUpperCase();
    if (!cnpj || !razao || !numeroControle || !uf) continue;

    const valor = parseValorBR(r["valor_global"]) ?? null;
    const objeto = (r["objeto"] || "").trim();
    const tipoObra = classificarTipoObra(objeto);
    const ehConstrutora = pareceConstrutora(razao, null);

    let construtora = await prisma.construtora.findUnique({ where: { cnpj } });
    if (!construtora) {
      construtora = await prisma.construtora.create({
        data: {
          cnpj,
          razaoSocial: razao,
          uf,
          cidade: r["municipio"] || null,
          tags: ehConstrutora ? null : JSON.stringify(["revisar"]),
          fonteEnriquecimento: "pncp-csv-seed",
        },
      });
      cnpjsVistos.add(cnpj);
    }

    const exists = await prisma.contrato.findUnique({ where: { numeroControlePNCP: numeroControle } });
    if (exists) continue;

    await prisma.contrato.create({
      data: {
        construtoraId: construtora.id,
        numeroControlePNCP: numeroControle,
        numeroContrato: r["numero_contrato"] || null,
        objeto,
        valorGlobal: valor,
        orgaoContratante: r["orgao_contratante"] || null,
        uf,
        municipio: r["municipio"] || null,
        modalidade: r["modalidade"] || null,
        linkPncp: r["link_pncp"] || null,
        tipoObra,
      },
    });
    novosContratos++;
  }

  return { contratos: novosContratos, construtoras: cnpjsVistos.size };
}
