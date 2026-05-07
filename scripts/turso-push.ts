// Aplica o schema.prisma diretamente no Turso (libSQL) via @libsql/client.
// Necessario porque o Prisma 5 nao aceita URL libsql:// no `db push` (so file:).
//
// Uso:
//   $env:TURSO_DATABASE_URL = "libsql://...turso.io"
//   $env:TURSO_AUTH_TOKEN   = "<token>"
//   npm.cmd run db:push:turso

import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL ausente no ambiente");
  if (!authToken) throw new Error("TURSO_AUTH_TOKEN ausente no ambiente");

  console.log("→ Gerando schema SQL via `prisma migrate diff`...");
  const sql = execSync(
    `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`,
    {
      encoding: "utf8",
      env: { ...process.env, DATABASE_URL: "file:./_diff_tmp.db" },
    }
  );

  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`→ ${statements.length} comandos SQL a aplicar no Turso\n`);

  const db = createClient({ url, authToken });
  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, " ").slice(0, 80);
    console.log(`  > ${preview}...`);
    await db.execute(stmt);
  }

  console.log("\n✓ Schema aplicado ao Turso com sucesso.");
}

main().catch((e) => {
  console.error("✗ Falhou:", e instanceof Error ? e.message : e);
  process.exit(1);
});
