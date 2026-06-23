import "dotenv/config";

import { defineConfig } from "prisma/config";
import { z } from "zod";

const databaseUrlSchema = z
  .string()
  .min(1)
  .default("postgresql://postgres:postgres@localhost:5432/forge_sprint_kanban");

const databaseUrl = databaseUrlSchema.parse(process.env.DATABASE_URL);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
