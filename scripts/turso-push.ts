// Aplica o schema.prisma diretamente no Turso (libSQL) via @libsql/client.
// Necessario porque o Prisma 5 nao aceita URL libsql:// no `db push` (so file:).
//
// Idempotente: derruba as tabelas antes de recriar.
//
// Uso:
//   $env:TURSO_DATABASE_URL = "libsql://...turso.io"
//   $env:TURSO_AUTH_TOKEN   = "<token>"
//   npm.cmd run db:push:turso

import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";

const TABLES = [
  "Reuniao",
  "Interacao",
  "Decisor",
  "Contrato",
  "Construtora",
  "SyncLog",
  "_prisma_migrations",
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL ausente no ambiente");
  if (!authToken) throw new Error("TURSO_AUTH_TOKEN ausente no ambiente");

  const db = createClient({ url, authToken });

  console.log("→ Derrubando tabelas antigas (se existirem)...");
  for (const t of TABLES) {
    await db.execute(`DROP TABLE IF EXISTS "${t}"`);
  }

  console.log("→ Gerando schema SQL via `prisma migrate diff`...");
  const sql = execSync(
    `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`,
    {
      encoding: "utf8",
      env: { ...process.env, DATABASE_URL: "file:./_diff_tmp.db" },
    }
  );

  console.log(`→ SQL gerado (${sql.length} chars). Primeiras 400 letras:\n`);
  console.log(sql.slice(0, 400));
  console.log("\n→ Aplicando no Turso (executeMultiple)...");

  await db.executeMultiple(sql);

  console.log("→ Verificando tabelas criadas...");
  const r = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  const nomes = r.rows.map((row: Record<string, unknown>) => String(row.name));
  console.log("  Tabelas:", nomes.join(", "));

  if (nomes.length === 0) {
    throw new Error("Nenhuma tabela foi criada no Turso!");
  }
  console.log("\n✓ Schema aplicado ao Turso com sucesso.");
}

main().catch((e) => {
  console.error("✗ Falhou:", e instanceof Error ? e.message : e);
  process.exit(1);
});
