import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { statsRoutes } from "../routes/stats.routes";

const mockGetStats = vi.fn();

vi.mock("../../services/stats.service", () => ({
  getStats: (...args: unknown[]) => mockGetStats(...args),
}));

async function buildApp() {
  const app = Fastify();
  await app.register(statsRoutes);
  await app.ready();
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("stats.controller", () => {
  it("GET /api/stats returns 200 with stats", async () => {
    mockGetStats.mockResolvedValueOnce({
      stats: [
        { neighborhood: "R1", parcelCount: 10, medianParcelSize: 0.35 },
        { neighborhood: "R2", parcelCount: 25, medianParcelSize: 0.18 },
      ],
    });

    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/stats?groupBy=neighborhood",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.stats).toHaveLength(2);
    expect(body.stats[0].neighborhood).toBe("R1");
  });

  it("GET /api/stats with invalid groupBy returns 400", async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/stats?groupBy=invalid",
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('groupBy must be "neighborhood"');
  });

  it("GET /api/stats without groupBy defaults to neighborhood", async () => {
    mockGetStats.mockResolvedValueOnce({ stats: [] });

    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/stats",
    });

    expect(response.statusCode).toBe(200);
  });

  it("GET /api/stats returns empty stats when no data", async () => {
    mockGetStats.mockResolvedValueOnce({ stats: [] });

    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/stats?groupBy=neighborhood",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.stats).toEqual([]);
  });
});
