import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { config } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const sql = postgres(config.databaseUrl);

  try {
    const migrationsDir = path.join(__dirname, "migrations");
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (!file.endsWith(".sql")) continue;

      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, "utf-8");

      console.log(`Running migration: ${file}`);
      await sql.unsafe(sqlContent);
      console.log(`  ✓ ${file} applied`);
    }

    console.log("All migrations applied successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
