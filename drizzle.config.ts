import path from "path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
