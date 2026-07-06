import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/arcgis",
  arcgis: {
    parcelsUrl: process.env.ARCGIS_PARCELS_URL || "",
    zoningUrl: process.env.ARCGIS_ZONING_URL || "",
  },
} as const;
