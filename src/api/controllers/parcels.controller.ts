import type { FastifyReply, FastifyRequest } from "fastify";
import { getResidentialParcels } from "../../services/parcels.service";

interface ResidentialQuery {
  minArea?: string;
}

export async function handleResidentialParcels(request: FastifyRequest, reply: FastifyReply) {
  const { minArea } = request.query as ResidentialQuery;

  if (minArea !== undefined && (Number.isNaN(Number(minArea)) || Number(minArea) < 0)) {
    return reply.status(400).send({ error: "minArea must be a non-negative number" });
  }

  const area = parseFloat(minArea || "0");
  const result = await getResidentialParcels(area);
  return reply.send(result);
}
