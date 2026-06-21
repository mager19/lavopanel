/**
 * Aplica las migraciones de drizzle/ a la base de datos de forma IDEMPOTENTE,
 * sin pérdida de datos. Ejecuta cada sentencia .sql y omite las que ya están
 * aplicadas (tabla/columna/índice ya existe).
 *
 * Uso:
 *   # contra producción (lee credenciales de .env.local):
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/db-apply.ts
 *
 *   # contra la DB local:
 *   TURSO_DATABASE_URL=file:local.db npx tsx scripts/db-apply.ts
 *
 * A diferencia de `drizzle-kit push`, NO trunca tablas: agregar una columna
 * NOT NULL con DEFAULT es seguro en SQLite y conserva las filas existentes.
 */
import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const IGNORE = /already exists|duplicate column/i;

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    console.error("Falta TURSO_DATABASE_URL en el entorno.");
    process.exit(1);
  }
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const dir = join(process.cwd(), "drizzle");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  let applied = 0;
  let skipped = 0;

  for (const file of files) {
    const content = readFileSync(join(dir, file), "utf8");
    const stmts = content
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of stmts) {
      try {
        await client.execute(stmt);
        applied++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (IGNORE.test(msg)) {
          skipped++;
        } else {
          console.error(`\nError en (${file}):\n${stmt.slice(0, 120)}\n→ ${msg}`);
          process.exit(1);
        }
      }
    }
  }

  console.log(`Listo. Sentencias aplicadas: ${applied} · ya existían (omitidas): ${skipped}`);
  process.exit(0);
}

main();
