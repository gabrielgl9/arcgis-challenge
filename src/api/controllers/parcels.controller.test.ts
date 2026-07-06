import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parcelsRoutes } from "../routes/parcels.routes";

const mockGetResidentialParcels = vi.fn();
const mockGetAverageLotSize = vi.fn();

vi.mock("../../services/parcels.service", () => ({
  getResidentialParcels: (...args: unknown[]) => mockGetResidentialParcels(...args),
  getAverageLotSize: (...args: unknown[]) => mockGetAverageLotSize(...args),
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
  describe("GET /api/parcels/residential", () => {
    it("returns 200 with parcels", async () => {
      mockGetResidentialParcels.mockResolvedValueOnce({
        parcels: [
          {
            id: 1,
            calculatedAreaAcres: 2.0,
            category: "R1",
            description: "Estate",
          },
        ],
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

    it("defaults minArea to 0", async () => {
      mockGetResidentialParcels.mockResolvedValueOnce({
        parcels: [],
        count: 0,
      });

      const app = await buildApp();
      const response = await app.inject({
        method: "GET",
        url: "/api/parcels/residential",
      });

      expect(response.statusCode).toBe(200);
      expect(mockGetResidentialParcels).toHaveBeenCalledWith(0);
    });

    it("returns 400 for invalid minArea", async () => {
      const app = await buildApp();
      const response = await app.inject({
        method: "GET",
        url: "/api/parcels/residential?minArea=abc",
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("minArea must be a non-negative number");
    });

    it("returns 400 for negative minArea", async () => {
      const app = await buildApp();
      const response = await app.inject({
        method: "GET",
        url: "/api/parcels/residential?minArea=-1",
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("error");
    });

    it("returns empty list when no matches", async () => {
      mockGetResidentialParcels.mockResolvedValueOnce({
        parcels: [],
        count: 0,
      });

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

  describe("GET /api/parcels/average-lot-size", () => {
    it("returns 200 with average and count", async () => {
      mockGetAverageLotSize.mockResolvedValueOnce({
        averageLotSizeAcres: 0.45,
        parcelCount: 87,
      });

      const app = await buildApp();
      const response = await app.inject({
        method: "GET",
        url: "/api/parcels/average-lot-size?lat=30.1&lng=-97.8",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.averageLotSizeAcres).toBe(0.45);
      expect(body.parcelCount).toBe(87);
    });

    it("returns 400 when lat is missing", async () => {
      const app = await buildApp();
      const response = await app.inject({
        method: "GET",
        url: "/api/parcels/average-lot-size?lng=-97.8",
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("lat and lng query parameters are required");
    });

    it("returns 400 when lng is missing", async () => {
      const app = await buildApp();
      const response = await app.inject({
        method: "GET",
        url: "/api/parcels/average-lot-size?lat=30.1",
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("lat and lng query parameters are required");
    });

    it("returns 400 for non-numeric lat", async () => {
      const app = await buildApp();
      const response = await app.inject({
        method: "GET",
        url: "/api/parcels/average-lot-size?lat=abc&lng=-97.8",
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("lat and lng must be numeric values");
    });

    it("returns 400 for lat out of range", async () => {
      const app = await buildApp();
      const response = await app.inject({
        method: "GET",
        url: "/api/parcels/average-lot-size?lat=100&lng=-97.8",
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("lat must be between -90 and 90");
    });

    it("returns 400 for lng out of range", async () => {
      const app = await buildApp();
      const response = await app.inject({
        method: "GET",
        url: "/api/parcels/average-lot-size?lat=30.1&lng=200",
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("lng between -180 and 180");
    });

    it("returns zeros when no parcels in range", async () => {
      mockGetAverageLotSize.mockResolvedValueOnce({
        averageLotSizeAcres: 0,
        parcelCount: 0,
      });

      const app = await buildApp();
      const response = await app.inject({
        method: "GET",
        url: "/api/parcels/average-lot-size?lat=0&lng=0",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.averageLotSizeAcres).toBe(0);
      expect(body.parcelCount).toBe(0);
    });
  });
});
