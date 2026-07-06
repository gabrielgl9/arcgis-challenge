import type { FastifyInstance } from "fastify";
import { handleResidentialParcels } from "../controllers/parcels.controller";

export async function parcelsRoutes(app: FastifyInstance) {
  app.get("/api/parcels/residential", handleResidentialParcels);
}
