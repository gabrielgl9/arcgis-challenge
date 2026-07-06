import type { FastifyReply, FastifyRequest } from "fastify";
import { getAverageLotSize, getResidentialParcels } from "../../services/parcels.service";

interface ResidentialQuery {
  minArea?: string;
}

interface AverageLotSizeQuery {
  lat?: string;
  lng?: string;
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

export async function handleAverageLotSize(request: FastifyRequest, reply: FastifyReply) {
  const { lat, lng } = request.query as AverageLotSizeQuery;

  if (!lat || !lng) {
    return reply.status(400).send({ error: "lat and lng query parameters are required" });
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return reply.status(400).send({ error: "lat and lng must be numeric values" });
  }

  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    return reply
      .status(400)
      .send({ error: "lat must be between -90 and 90, lng between -180 and 180" });
  }

  const result = await getAverageLotSize(latNum, lngNum);
  return reply.send(result);
}
