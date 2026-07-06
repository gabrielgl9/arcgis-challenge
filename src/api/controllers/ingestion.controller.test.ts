import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ingestionRoutes } from "../routes/ingestion.routes";

const mockRunIngestion = vi.fn();

vi.mock("../../services/ingestion.service", () => ({
  runIngestion: (...args: unknown[]) => mockRunIngestion(...args),
}));

async function buildApp() {
  const app = Fastify();
  await app.register(ingestionRoutes);
  await app.ready();
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ingestion.controller", () => {
  it("POST /api/ingestion returns 200 with status ok", async () => {
    mockRunIngestion.mockResolvedValueOnce({ zoningCount: 126, parcelsCount: 103168 });

    const app = await buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/ingestion",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe("ok");
    expect(body.zoningCount).toBe(126);
    expect(body.parcelsCount).toBe(103168);
  });

  it("POST /api/ingestion returns 500 on failure", async () => {
    mockRunIngestion.mockRejectedValueOnce(new Error("DB connection failed"));

    const app = await buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/ingestion",
    });

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Ingestion failed");
  });
});
