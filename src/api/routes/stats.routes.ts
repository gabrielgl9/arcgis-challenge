import type { FastifyInstance } from "fastify";
import { handleStats } from "../controllers/stats.controller";

export async function statsRoutes(app: FastifyInstance) {
  app.get("/api/stats", handleStats);
}
