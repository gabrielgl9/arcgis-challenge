import type { FastifyInstance } from "fastify";
import { handleIngestion } from "../controllers/ingestion.controller";

export async function ingestionRoutes(app: FastifyInstance) {
  app.post("/api/ingestion", handleIngestion);
}
