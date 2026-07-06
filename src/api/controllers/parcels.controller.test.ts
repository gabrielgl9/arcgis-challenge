import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parcelsRoutes } from "../routes/parcels.routes";

const mockGetResidentialParcels = vi.fn();

vi.mock("../../services/parcels.service", () => ({
  getResidentialParcels: (...args: unknown[]) => mockGetResidentialParcels(...args),
}));

async function buildApp() {
  const app = Fastify();
  await app.register(parcelsRoutes);
  await app.ready();
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parcels.controller", () => {
  it("GET /api/parcels/residential returns 200 with parcels", async () => {
    mockGetResidentialParcels.mockResolvedValueOnce({
      parcels: [{ id: 1, calculatedAreaAcres: 2.0, category: "R1", description: "Estate" }],
      count: 1,
    });

    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/parcels/residential?minArea=1",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.parcels).toHaveLength(1);
    expect(body.count).toBe(1);
  });

  it("GET /api/parcels/residential without minArea defaults to 0", async () => {
    mockGetResidentialParcels.mockResolvedValueOnce({ parcels: [], count: 0 });

    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/parcels/residential",
    });

    expect(response.statusCode).toBe(200);
    expect(mockGetResidentialParcels).toHaveBeenCalledWith(0);
  });

  it("GET /api/parcels/residential with invalid minArea returns 400", async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/parcels/residential?minArea=abc",
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("minArea must be a non-negative number");
  });

  it("GET /api/parcels/residential with negative minArea returns 400", async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/parcels/residential?minArea=-1",
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("error");
  });

  it("GET /api/parcels/residential returns empty list when no matches", async () => {
    mockGetResidentialParcels.mockResolvedValueOnce({ parcels: [], count: 0 });

    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/parcels/residential?minArea=999",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.parcels).toEqual([]);
    expect(body.count).toBe(0);
  });
});
