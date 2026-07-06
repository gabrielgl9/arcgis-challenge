import type { FastifyInstance } from "fastify";
import { handleAverageLotSize, handleResidentialParcels } from "../controllers/parcels.controller";

export async function parcelsRoutes(app: FastifyInstance) {
  app.get("/api/parcels/residential", handleResidentialParcels);
  app.get("/api/parcels/average-lot-size", handleAverageLotSize);
}
