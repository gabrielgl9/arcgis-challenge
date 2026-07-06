import type { FastifyReply, FastifyRequest } from "fastify";
import { getStats } from "../../services/stats.service";

interface StatsQuery {
  groupBy?: string;
}

const VALID_GROUP_BY = ["neighborhood"];

export async function handleStats(request: FastifyRequest, reply: FastifyReply) {
  const { groupBy } = request.query as StatsQuery;

  if (groupBy && !VALID_GROUP_BY.includes(groupBy)) {
    return reply.status(400).send({ error: 'groupBy must be "neighborhood"' });
  }

  const result = await getStats(groupBy);
  return reply.send(result);
}
