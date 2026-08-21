import { defineConfig } from "drizzle-kit";

// Lee el esquema D1 y genera migraciones SQLite en `drizzle/`, directorio que
// el plugin de Sites incorpora después al artefacto desplegable.
export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "sqlite",
});
