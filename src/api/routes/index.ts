import type { FastifyInstance } from "fastify";
import { ingestionRoutes } from "./ingestion.routes";
import { parcelsRoutes } from "./parcels.routes";
import { statsRoutes } from "./stats.routes";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(ingestionRoutes);
  await app.register(parcelsRoutes);
  await app.register(statsRoutes);
}
