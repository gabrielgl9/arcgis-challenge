import type { FastifyReply, FastifyRequest } from "fastify";
import { runIngestion } from "../../services/ingestion.service";

export async function handleIngestion(request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await runIngestion();
    return reply.send({ status: "ok", ...result });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: "Ingestion failed" });
  }
}
