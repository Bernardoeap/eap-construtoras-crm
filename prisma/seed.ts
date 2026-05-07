import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { importContratos } from "../data-import/import-contratos";
import { importDecisores } from "../data-import/import-decisores";

function makeClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  console.log(`[seed] TURSO_DATABASE_URL = ${tursoUrl ? tursoUrl.slice(0, 50) + "..." : "(nao setada)"}`);
  console.log(`[seed] TURSO_AUTH_TOKEN   = ${tursoToken ? "(setado, " + tursoToken.length + " chars)" : "(nao setado)"}`);
  console.log(`[seed] DATABASE_URL       = ${process.env.DATABASE_URL ?? "(nao setado)"}`);
  if (tursoUrl) {
    console.log("[seed] → conectando ao Turso via libSQL adapter");
    const adapter = new PrismaLibSQL({ url: tursoUrl, authToken: tursoToken });
    return new PrismaClient({ adapter });
  }
  console.log("[seed] → conectando via DATABASE_URL (SQLite local)");
  return new PrismaClient();
}

const prisma = makeClient();

async function main() {
  console.log("== EAP CRM | seed ==");

  const c = await importContratos(prisma);
  console.log(`Contratos novos: ${c.contratos} | Construtoras novas: ${c.construtoras}`);

  const d = await importDecisores(prisma);
  console.log(`Decisores inseridos: ${d.decisores} | Descartados: ${d.descartados}`);

  const total = await prisma.construtora.count();
  const totalContratos = await prisma.contrato.count();
  const totalDecisores = await prisma.decisor.count();
  console.log(`\nTotal no banco: ${total} construtoras | ${totalContratos} contratos | ${totalDecisores} decisores`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
