// Runs before `next build`. On a fresh database (for example a new Supabase project) it creates the
// tables and loads the Crescent Bank demo data, so going live needs no commands on your computer.
// It never touches a database that already has employees in it.
import { execSync } from "node:child_process";
import "dotenv/config";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[prepare-db] DATABASE_URL is not set, so the database step is skipped.");
  process.exit(0);
}

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

console.log("[prepare-db] Applying database migrations…");
run("npx prisma migrate deploy");

const client = new pg.Client({ connectionString: url });
await client.connect();
const { rows } = await client.query('select count(*)::int as n from "Employee"');
await client.end();

if (rows[0].n === 0) {
  console.log("[prepare-db] The database is empty. Loading the Crescent Bank demo data…");
  run("npx tsx prisma/seed.ts");
} else {
  console.log(`[prepare-db] The database already has ${rows[0].n} employees. Leaving the data as it is.`);
}
