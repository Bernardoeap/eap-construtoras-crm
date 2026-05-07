import { PrismaClient } from "@prisma/client";
import { importContratos } from "../data-import/import-contratos";
import { importDecisores } from "../data-import/import-decisores";

const prisma = new PrismaClient();

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
