// Applies db/schema.sql then db/seed.sql to DATABASE_URL (read from .env.local if not set). Safe to re-run.
//   node scripts/migrate.mjs
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
if (!process.env.DATABASE_URL && existsSync(path.join(root, ".env.local"))) {
  for (const line of readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
for (const file of ["schema.sql", "seed.sql"]) {
  const sql = readFileSync(path.join(root, "db", file), "utf8");
  await pool.query(sql);
  console.log("applied", file);
}
const { rows } = await pool.query("select table_name from information_schema.tables where table_schema = 'public' order by 1");
console.log("tables:", rows.map((r) => r.table_name).join(", "));
await pool.end();
